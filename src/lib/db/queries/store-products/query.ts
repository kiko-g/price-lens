import { createClient } from "@/lib/supabase/server"
import type {
  StoreProductsQueryParams,
  StoreProductsQueryResult,
  StoreProductWithMeta,
  PaginationMeta,
} from "./types"
import { DEFAULT_PAGINATION, DEFAULT_SORT, DEFAULT_FLAGS } from "./types"

/**
 * Main query function for fetching store products
 * Handles all filtering, sorting, pagination, and user-specific augmentation
 */
export async function queryStoreProducts(
  params: StoreProductsQueryParams = {},
): Promise<StoreProductsQueryResult> {
  const supabase = createClient()

  // Apply defaults
  const pagination = { ...DEFAULT_PAGINATION, ...params.pagination }
  const sort = { ...DEFAULT_SORT, ...params.sort }
  const flags = { ...DEFAULT_FLAGS, ...params.flags }

  const offset = (pagination.page - 1) * pagination.limit

  // Build the base query
  let query = supabase.from("store_products").select("*", { count: "exact" })

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
  // Apply Pagination
  // ============================================================================

  query = query.range(offset, offset + pagination.limit - 1)

  // ============================================================================
  // Execute Query
  // ============================================================================

  const { data, error, count } = await query

  if (error) {
    return {
      data: [],
      pagination: createEmptyPagination(pagination),
      error: { message: error.message, code: error.code },
    }
  }

  // ============================================================================
  // Augment with User Data (favorites)
  // ============================================================================

  let augmentedData: StoreProductWithMeta[] = data ?? []

  if (params.userId && augmentedData.length > 0) {
    augmentedData = await augmentWithFavorites(supabase, augmentedData, params.userId)
  }

  // ============================================================================
  // Build Response
  // ============================================================================

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / pagination.limit)

  return {
    data: augmentedData,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
    error: null,
  }
}

// ============================================================================
// Filter Helper Functions
// ============================================================================

function applyPriorityFilter(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
  params: StoreProductsQueryParams,
  flags: typeof DEFAULT_FLAGS,
) {
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

function applyOriginFilter(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
  params: StoreProductsQueryParams,
) {
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

function applyCategoryFilter(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
  params: StoreProductsQueryParams,
) {
  if (!params.categories) return query

  // Hierarchical categories take precedence
  if (params.categories.hierarchy) {
    const { category1, category2, category3 } = params.categories.hierarchy
    if (category1 && category2 && category3) {
      return query
        .eq("category", category1)
        .eq("category_2", category2)
        .eq("category_3", category3)
    }
  }

  // Flat categories (OR logic)
  if (params.categories.categories && params.categories.categories.length > 0) {
    return query.in("category", params.categories.categories)
  }

  return query
}

function applySearchFilter(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
  params: StoreProductsQueryParams,
) {
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

function applySorting(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
  sortBy: string,
) {
  switch (sortBy) {
    case "a-z":
      return query.order("name", { ascending: true })
    case "z-a":
      return query.order("name", { ascending: false })
    case "price-low-high":
      return query.order("price", { ascending: true })
    case "price-high-low":
      return query.order("price", { ascending: false })
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
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: pagination.page > 1,
  }
}

