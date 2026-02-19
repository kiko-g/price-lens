import { createClient } from "@/lib/supabase/server"
import { fetchAll } from "@/lib/supabase/fetch-all"
import { withTimeout } from "@/lib/resilience"
import type { SupabaseClient } from "./types"
import type { StoreProductsQueryParams, StoreProductsQueryResult, StoreProductWithMeta, PaginationMeta } from "./types"
import { DEFAULT_PAGINATION, DEFAULT_SORT, DEFAULT_FLAGS } from "./types"

const SUPABASE_QUERY_TIMEOUT_MS = parseInt(process.env.SUPABASE_QUERY_TIMEOUT_MS || "15000", 10)

// Explicit column lists to avoid SELECT * egress overhead
const LISTING_COLUMNS = [
  "id", "origin_id", "url", "name", "brand", "barcode", "pack",
  "price", "price_recommended", "price_per_major_unit", "major_unit",
  "discount", "image", "category", "category_2", "category_3",
  "priority", "priority_source", "priority_updated_at",
  "available", "updated_at",
].join(", ")

const LISTING_COLUMNS_CANONICAL = [
  LISTING_COLUMNS,
  "canonical_category_name", "canonical_category_name_2", "canonical_category_name_3",
].join(", ")

// ============================================================================
// Canonical Category Helpers
// ============================================================================

/**
 * Get all descendant category IDs for a given canonical category (including itself)
 * This recursively fetches children at all levels
 */
async function getDescendantCategoryIds(
  supabase: ReturnType<typeof createClient>,
  categoryId: number,
): Promise<number[]> {
  const ids: number[] = [categoryId]

  // Fetch all canonical categories at once (they're cached and there are only ~350)
  const { data: allCategories, error } = await supabase.from("canonical_categories").select("id, parent_id")

  if (error || !allCategories) {
    return ids
  }

  // Build parent->children map for fast lookup
  const childrenMap = new Map<number, number[]>()
  for (const cat of allCategories) {
    if (cat.parent_id !== null) {
      const children = childrenMap.get(cat.parent_id) || []
      children.push(cat.id)
      childrenMap.set(cat.parent_id, children)
    }
  }

  // BFS to collect all descendants
  const queue = [categoryId]
  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = childrenMap.get(currentId) || []
    for (const childId of children) {
      ids.push(childId)
      queue.push(childId)
    }
  }

  return ids
}

/**
 * Main query function for fetching store products
 * Handles all filtering, sorting, pagination, and user-specific augmentation
 *
 * @param params - Query parameters (filters, sort, pagination)
 * @param client - Optional Supabase client (avoids duplicate createClient() on cold start)
 */
export async function queryStoreProducts(
  params: StoreProductsQueryParams = {},
  client?: SupabaseClient,
): Promise<StoreProductsQueryResult> {
  const supabase = client ?? createClient()

  // Apply defaults
  const pagination = { ...DEFAULT_PAGINATION, ...params.pagination }
  const sort = { ...DEFAULT_SORT, ...params.sort }
  const flags = { ...DEFAULT_FLAGS, ...params.flags }

  const offset = (pagination.page - 1) * pagination.limit

  // Determine which table/view to use based on canonical category filter
  const useCanonicalView = !!params.canonicalCategory?.categoryId
  const tableName = useCanonicalView ? "store_products_with_canonical" : "store_products"

  // If using canonical category filter, get all descendant IDs
  let canonicalCategoryIds: number[] = []
  if (params.canonicalCategory?.categoryId) {
    canonicalCategoryIds = await getDescendantCategoryIds(supabase, params.canonicalCategory.categoryId)
  }

  // Build the base query - no count: "exact" to avoid expensive COUNT(*) OVER()
  // Instead, fetch limit+1 rows to determine hasNextPage
  const columns = useCanonicalView ? LISTING_COLUMNS_CANONICAL : LISTING_COLUMNS
  let query = supabase.from(tableName).select(columns)

  // Apply canonical category filter if present (must use the view)
  if (canonicalCategoryIds.length > 0) {
    query = query.in("canonical_category_id", canonicalCategoryIds)
  }

  // ============================================================================
  // Apply Filters
  // ============================================================================

  // 1. Empty names filter
  if (flags.excludeEmptyNames) {
    query = query.not("name", "eq", "").not("name", "is", null)
  }

  // 2. Priority filter
  query = applyPriorityFilter(query, params, flags)

  // 3. Origin filter
  query = applyOriginFilter(query, params)

  // 4. Category filter
  query = applyCategoryFilter(query, params)

  // 5. Text search filter
  query = applySearchFilter(query, params)

  // 6. Discount filter
  if (flags.onlyDiscounted) {
    query = query.gt("discount", 0)
  }

  // 7. Availability filter
  if (flags.onlyAvailable) {
    query = query.eq("available", true)
  }

  // 8. Source filter (priority_source)
  query = applySourceFilter(query, params)

  // ============================================================================
  // Apply Sorting
  // ============================================================================

  // Priority ordering (if enabled, sort by priority first)
  if (sort.prioritizeByPriority) {
    query = query.order("priority", { ascending: false, nullsFirst: false })
  }

  // Main sort
  query = applySorting(query, sort.sortBy)

  // ============================================================================
  // Apply Pagination (fetch limit+1 to detect hasNextPage without COUNT)
  // ============================================================================

  query = query.range(offset, offset + pagination.limit)

  // ============================================================================
  // Execute Query (with timeout to prevent indefinite hangs)
  // ============================================================================

  const { data, error } = await withTimeout(
    Promise.resolve(query) as Promise<{ data: StoreProductWithMeta[] | null; error: { message: string; code?: string } | null }>,
    SUPABASE_QUERY_TIMEOUT_MS,
  )

  if (error) {
    return {
      data: [],
      pagination: createEmptyPagination(pagination),
      error: { message: error.message, code: error.code },
    }
  }

  // ============================================================================
  // Determine pagination from limit+1 pattern
  // ============================================================================

  const rows = data ?? []
  const hasNextPage = rows.length > pagination.limit
  const pageData = hasNextPage ? rows.slice(0, pagination.limit) : rows

  // ============================================================================
  // Augment with User Data (favorites)
  // ============================================================================

  let augmentedData: StoreProductWithMeta[] = pageData

  if (params.userId && augmentedData.length > 0) {
    augmentedData = await augmentWithFavorites(supabase, augmentedData, params.userId)
  }

  // ============================================================================
  // Build Response
  // ============================================================================

  return {
    data: augmentedData,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount: null,
      totalPages: null,
      hasNextPage,
      hasPreviousPage: pagination.page > 1,
    },
    error: null,
  }
}

// ============================================================================
// Filter Helper Functions
// ============================================================================

function applyPriorityFilter<Q extends { [key: string]: any }>(
  query: Q,
  params: StoreProductsQueryParams,
  flags: typeof DEFAULT_FLAGS,
): Q {
  // If specific priority values are provided, use them
  if (params.priority?.values && params.priority.values.length > 0) {
    const values = params.priority.values
    const hasNull = values.includes(null)
    const numericValues = values.filter((v): v is number => v !== null)

    if (hasNull && numericValues.length > 0) {
      // Mixed: null OR specific numbers
      const conditions = [`priority.is.null`, `priority.in.(${numericValues.join(",")})`]
      return query.or(conditions.join(","))
    } else if (hasNull) {
      // Only null priorities
      return query.is("priority", null)
    } else if (numericValues.length > 0) {
      // Only numeric priorities
      return query.in("priority", numericValues)
    }
  }

  // If onlyTracked flag is set, filter to priority 1-5
  if (flags.onlyTracked) {
    return query.in("priority", [1, 2, 3, 4, 5])
  }

  return query
}

function applyOriginFilter<Q extends { [key: string]: any }>(query: Q, params: StoreProductsQueryParams): Q {
  if (!params.origin?.originIds) return query

  const ids = params.origin.originIds
  if (Array.isArray(ids)) {
    if (ids.length === 1) {
      return query.eq("origin_id", ids[0])
    } else if (ids.length > 1) {
      return query.in("origin_id", ids)
    }
  } else {
    return query.eq("origin_id", ids)
  }

  return query
}

function applySourceFilter<Q extends { [key: string]: any }>(query: Q, params: StoreProductsQueryParams): Q {
  if (!params.source?.values || params.source.values.length === 0) return query

  const values = params.source.values
  if (values.length === 1) {
    return query.eq("priority_source", values[0])
  }
  return query.in("priority_source", values)
}

function applyCategoryFilter<Q extends { [key: string]: any }>(query: Q, params: StoreProductsQueryParams): Q {
  if (!params.categories) return query

  // Tuple-based filtering (OR logic for multiple tuples)
  if (params.categories.tuples && params.categories.tuples.length > 0) {
    const conditions = params.categories.tuples.map((tuple) => {
      // Escape special characters in category values for PostgREST
      const escapeCat = (s: string) => s.replace(/[,()]/g, "\\$&")

      if (tuple.category_3) {
        // 3-way tuple: exact match on all three levels
        return `and(category.eq.${escapeCat(tuple.category)},category_2.eq.${escapeCat(tuple.category_2)},category_3.eq.${escapeCat(tuple.category_3)})`
      } else {
        // 2-way tuple: match any product with that category + category_2 combination
        return `and(category.eq.${escapeCat(tuple.category)},category_2.eq.${escapeCat(tuple.category_2)})`
      }
    })
    return query.or(conditions.join(","))
  }

  // Hierarchical categories - apply each level if provided
  if (params.categories.hierarchy) {
    const { category1, category2, category3 } = params.categories.hierarchy
    let filteredQuery = query

    if (category1) {
      filteredQuery = filteredQuery.eq("category", category1)
    }
    if (category2) {
      filteredQuery = filteredQuery.eq("category_2", category2)
    }
    if (category3) {
      filteredQuery = filteredQuery.eq("category_3", category3)
    }

    return filteredQuery
  }

  // Flat categories (OR logic)
  if (params.categories.categories && params.categories.categories.length > 0) {
    return query.in("category", params.categories.categories)
  }

  return query
}

function applySearchFilter<Q extends { [key: string]: any }>(query: Q, params: StoreProductsQueryParams): Q {
  if (!params.search?.query) return query

  const searchQuery = params.search.query
  const searchIn = params.search.searchIn

  // Sanitize query: remove special characters except alphanumeric and accented chars
  const sanitizedQuery = searchQuery.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()
  if (!sanitizedQuery) return query

  switch (searchIn) {
    case "url":
      return query.ilike("url", `%${sanitizedQuery}%`)

    case "any": {
      // Joint search within brand, url, name and category
      const pattern = `%${sanitizedQuery.replace(/ /g, "%")}%`
      const conditions = [
        `brand.ilike.${pattern}`,
        `url.ilike.${pattern}`,
        `name.ilike.${pattern}`,
        `category.ilike.${pattern}`,
      ]
      return query.or(conditions.join(","))
    }

    case "name":
    case "brand":
    case "category": {
      // Full-text search on specific field
      const formattedQuery = sanitizedQuery.split(/\s+/).filter(Boolean).join(" & ")
      if (formattedQuery) {
        return query.textSearch(searchIn, formattedQuery)
      }
      return query
    }

    default:
      return query
  }
}

function applySorting<Q extends { [key: string]: any }>(query: Q, sortBy: string): Q {
  switch (sortBy) {
    case "a-z":
      return query.order("name", { ascending: true })
    case "z-a":
      return query.order("name", { ascending: false })
    case "price-low-high":
      return query.order("price", { ascending: true })
    case "price-high-low":
      return query.order("price", { ascending: false })
    case "created-newest":
      return query.order("created_at", { ascending: false })
    case "created-oldest":
      return query.order("created_at", { ascending: true })
    case "updated-newest":
      return query.order("updated_at", { ascending: false, nullsFirst: false })
    case "updated-oldest":
      return query.order("updated_at", { ascending: true, nullsFirst: true })
    case "only-nulls":
      // Special sort for invalid products
      return query.is("name", null).order("url", { ascending: true })
    default:
      return query.order("name", { ascending: true })
  }
}

// ============================================================================
// Augmentation Helper Functions
// ============================================================================

async function augmentWithFavorites(
  supabase: ReturnType<typeof createClient>,
  products: StoreProductWithMeta[],
  userId: string,
): Promise<StoreProductWithMeta[]> {
  const storeProductIds = products.map((sp) => sp.id).filter(Boolean)

  if (storeProductIds.length === 0) return products

  const { data: favorites } = await supabase
    .from("user_favorites")
    .select("store_product_id")
    .eq("user_id", userId)
    .in("store_product_id", storeProductIds)

  const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) ?? [])

  return products.map((sp) => ({
    ...sp,
    is_favorited: favoriteIds.has(sp.id),
  }))
}

// ============================================================================
// Utility Functions
// ============================================================================

function createEmptyPagination(pagination: { page: number; limit: number }): PaginationMeta {
  return {
    page: pagination.page,
    limit: pagination.limit,
    totalCount: null,
    totalPages: null,
    hasNextPage: false,
    hasPreviousPage: pagination.page > 1,
  }
}

// ============================================================================
// Bulk Update Functions
// ============================================================================

export interface BulkPriorityUpdateParams {
  /** Filter params to select which products to update */
  filters: StoreProductsQueryParams
  /** New priority value (0-5) */
  priority: number
  /** Skip products with these existing priorities (0-5) */
  excludePriorities?: number[]
}

export interface BulkPriorityUpdateResult {
  /** Number of products updated */
  updatedCount: number
  /** Error if any */
  error: { message: string; code?: string } | null
}

/**
 * Get count of products matching the filter criteria (for preview)
 */
export async function getMatchingProductsCount(
  params: StoreProductsQueryParams,
): Promise<{ count: number; error: { message: string } | null }> {
  const supabase = createClient()
  const flags = { ...DEFAULT_FLAGS, ...params.flags }

  // Determine which table/view to use based on canonical category filter
  const useCanonicalView = !!params.canonicalCategory?.categoryId
  const tableName = useCanonicalView ? "store_products_with_canonical" : "store_products"

  // If using canonical category filter, get all descendant IDs
  let canonicalCategoryIds: number[] = []
  if (params.canonicalCategory?.categoryId) {
    canonicalCategoryIds = await getDescendantCategoryIds(supabase, params.canonicalCategory.categoryId)
  }

  // Build query with just count
  let query = supabase.from(tableName).select("id", { count: "exact", head: true })

  // Apply canonical category filter if present
  if (canonicalCategoryIds.length > 0) {
    query = query.in("canonical_category_id", canonicalCategoryIds)
  }

  // Apply all filters (same as queryStoreProducts but without pagination/sorting)
  if (flags.excludeEmptyNames) {
    query = query.not("name", "eq", "").not("name", "is", null)
  }

  query = applyPriorityFilter(query, params, flags)
  query = applyOriginFilter(query, params)
  query = applyCategoryFilter(query, params)
  query = applySearchFilter(query, params)
  query = applySourceFilter(query, params)

  if (flags.onlyDiscounted) {
    query = query.gt("discount", 0)
  }

  if (flags.onlyAvailable) {
    query = query.eq("available", true)
  }

  const { count, error } = await query

  if (error) {
    return { count: 0, error: { message: error.message } }
  }

  return { count: count ?? 0, error: null }
}

export interface PriorityDistribution {
  [priority: number]: number
}

export interface PriorityDistributionResult {
  count: number
  distribution: PriorityDistribution
  error: { message: string } | null
}

/**
 * Get count and priority distribution of products matching the filter criteria
 * Uses parallel count queries for each priority level (fast, ~7 requests instead of N/1000)
 */
export async function getMatchingProductsWithDistribution(
  params: StoreProductsQueryParams,
): Promise<PriorityDistributionResult> {
  const supabase = createClient()
  const flags = { ...DEFAULT_FLAGS, ...params.flags }

  // Determine which table/view to use based on canonical category filter
  const useCanonicalView = !!params.canonicalCategory?.categoryId
  const tableName = useCanonicalView ? "store_products_with_canonical" : "store_products"

  // If using canonical category filter, get all descendant IDs
  let canonicalCategoryIds: number[] = []
  if (params.canonicalCategory?.categoryId) {
    canonicalCategoryIds = await getDescendantCategoryIds(supabase, params.canonicalCategory.categoryId)
  }

  // Helper to build base count query with all filters (without priority filter)
  const buildBaseCountQuery = () => {
    let query = supabase.from(tableName).select("id", { count: "exact", head: true })

    // Apply canonical category filter if present
    if (canonicalCategoryIds.length > 0) {
      query = query.in("canonical_category_id", canonicalCategoryIds)
    }

    if (flags.excludeEmptyNames) {
      query = query.not("name", "eq", "").not("name", "is", null)
    }

    // Apply all filters EXCEPT priority (we want to see all priorities in the distribution)
    query = applyOriginFilter(query, params)
    query = applyCategoryFilter(query, params)
    query = applySearchFilter(query, params)
    query = applySourceFilter(query, params)

    if (flags.onlyDiscounted) {
      query = query.gt("discount", 0)
    }

    if (flags.onlyAvailable) {
      query = query.eq("available", true)
    }

    return query
  }

  // Run parallel count queries for each priority level (0-5) plus null
  const priorityLevels = [0, 1, 2, 3, 4, 5, null] as const

  const countPromises = priorityLevels.map(async (priority) => {
    const query = buildBaseCountQuery()
    const filteredQuery = priority === null ? query.is("priority", null) : query.eq("priority", priority)
    const { count, error } = await filteredQuery
    return { priority, count: count ?? 0, error }
  })

  const results = await Promise.all(countPromises)

  // Check for errors
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    return { count: 0, distribution: {}, error: { message: firstError.error.message } }
  }

  // Build distribution object
  const distribution: PriorityDistribution = {}
  let totalCount = 0

  for (const result of results) {
    if (result.count > 0) {
      const key = result.priority ?? -1 // Use -1 for null priorities
      distribution[key] = result.count
      totalCount += result.count
    }
  }

  return {
    count: totalCount,
    distribution,
    error: null,
  }
}

/**
 * Bulk update priority for all products matching the filter criteria
 */
export async function bulkUpdatePriority(params: BulkPriorityUpdateParams): Promise<BulkPriorityUpdateResult> {
  const supabase = createClient()
  const flags = { ...DEFAULT_FLAGS, ...params.filters.flags }

  // Determine which table/view to use based on canonical category filter
  const useCanonicalView = !!params.filters.canonicalCategory?.categoryId
  const tableName = useCanonicalView ? "store_products_with_canonical" : "store_products"

  // If using canonical category filter, get all descendant IDs
  let canonicalCategoryIds: number[] = []
  if (params.filters.canonicalCategory?.categoryId) {
    canonicalCategoryIds = await getDescendantCategoryIds(supabase, params.filters.canonicalCategory.categoryId)
  }

  // Helper to build the base query with all filters
  const buildFilteredQuery = () => {
    let query = supabase.from(tableName).select("id")

    // Apply canonical category filter if present
    if (canonicalCategoryIds.length > 0) {
      query = query.in("canonical_category_id", canonicalCategoryIds)
    }

    // Apply all filters
    if (flags.excludeEmptyNames) {
      query = query.not("name", "eq", "").not("name", "is", null)
    }

    query = applyPriorityFilter(query, params.filters, flags)
    query = applyOriginFilter(query, params.filters)
    query = applyCategoryFilter(query, params.filters)
    query = applySearchFilter(query, params.filters)
    query = applySourceFilter(query, params.filters)

    if (flags.onlyDiscounted) {
      query = query.gt("discount", 0)
    }

    if (flags.onlyAvailable) {
      query = query.eq("available", true)
    }

    // Exclude products with specified priorities (for preserving existing priorities)
    if (params.excludePriorities && params.excludePriorities.length > 0) {
      query = query.not("priority", "in", `(${params.excludePriorities.join(",")})`)
    }

    // Order by id for consistent pagination results
    query = query.order("id", { ascending: true })

    return query
  }

  // Fetch all matching IDs using fetchAll to avoid Supabase's default 1000 row limit
  const { data: idRows, error: fetchError } = await fetchAll(buildFilteredQuery)

  if (fetchError) {
    return {
      updatedCount: 0,
      error: { message: fetchError.message, code: fetchError.code },
    }
  }

  const allIds = idRows.map((p) => p.id)

  if (allIds.length === 0) {
    return { updatedCount: 0, error: null }
  }

  // Update in batches of 1000 to avoid query size limits
  const UPDATE_BATCH_SIZE = 1000
  let totalUpdated = 0

  for (let i = 0; i < allIds.length; i += UPDATE_BATCH_SIZE) {
    const batch = allIds.slice(i, i + UPDATE_BATCH_SIZE)

    const { error: updateError, count } = await supabase
      .from("store_products")
      .update({
        priority: params.priority,
        priority_source: "manual",
        priority_updated_at: new Date().toISOString(),
      })
      .in("id", batch)

    if (updateError) {
      return {
        updatedCount: totalUpdated,
        error: { message: updateError.message, code: updateError.code },
      }
    }

    totalUpdated += count ?? batch.length
  }

  return { updatedCount: totalUpdated, error: null }
}
