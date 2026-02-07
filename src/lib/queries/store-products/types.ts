import type { SearchType, SortByType } from "@/types/business"
import { SupermarketChain } from "@/types/business"
import type { StoreProduct, PrioritySource } from "@/types"
import { createClient } from "@/lib/supabase/server"

/**
 * Store Products Query System
 *
 * This module provides a robust, type-safe interface for querying store products.
 * All filters are optional and can be combined freely.
 */

// Re-export SupermarketChain for convenience
export { SupermarketChain }

/** Supabase client type derived from our server createClient */
export type SupabaseClient = ReturnType<typeof createClient>

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Text search filter options
 */
export interface TextSearchFilter {
  /** The search query string */
  query: string
  /**
   * Which fields to search in
   * - "any": searches across name, brand, url, and category
   * - "name": full-text search on product name
   * - "brand": full-text search on brand
   * - "url": partial match on URL
   * - "category": full-text search on category
   */
  searchIn: SearchType
}

/**
 * A category tuple representing a combination of category levels
 */
export interface CategoryTuple {
  category: string
  category_2: string
  category_3?: string
}

/**
 * Category filter options
 * Supports flat category selection, hierarchical 3-level categories, or tuple multi-select
 */
export interface CategoryFilter {
  /**
   * Flat list of main categories to filter by (uses OR logic)
   * Only used if hierarchical categories are not set
   */
  categories?: string[]

  /**
   * Hierarchical category filter
   * Uses exact matching on each level. Each level is optional.
   */
  hierarchy?: {
    category1?: string
    category2?: string
    category3?: string
  }

  /**
   * Category tuple multi-select
   * Each tuple represents a category combination.
   * If category_3 is omitted, matches all products with that category + category_2 combination.
   */
  tuples?: CategoryTuple[]
}

/**
 * Store/origin filter
 * Supports filtering by single or multiple store origins
 */
export interface OriginFilter {
  /**
   * Single origin ID or array of origin IDs
   * Uses SupermarketChain enum values:
   * - SupermarketChain.Continente (1)
   * - SupermarketChain.Auchan (2)
   * - SupermarketChain.PingoDoce (3)
   */
  originIds: SupermarketChain | SupermarketChain[]
}

/**
 * Priority filter options
 * Priority values range from 0-5, with null meaning unclassified
 */
export interface PriorityFilter {
  /**
   * Filter by specific priority values
   * - Numbers 0-5 for specific priorities
   * - null to include products without priority
   */
  values: (number | null)[]
}

/**
 * Source filter options
 * Filter products by how their priority was set
 */
export interface SourceFilter {
  /**
   * Filter by priority source values
   * - "ai": Priority set by AI classifier
   * - "manual": Priority set manually
   */
  values: PrioritySource[]
}

/**
 * Canonical category filter options
 * Filters products by their mapped canonical category
 * Selecting a parent category includes all products from its children
 */
export interface CanonicalCategoryFilter {
  /** The canonical category ID to filter by */
  categoryId: number
}

/**
 * Sorting options
 */
export interface SortOptions {
  /** Sort field and direction */
  sortBy: SortByType
  /** Whether to order by priority first (descending) before applying sortBy */
  prioritizeByPriority?: boolean
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Page number (1-indexed) */
  page: number
  /** Number of items per page */
  limit: number
}

/**
 * Additional filter flags
 */
export interface FilterFlags {
  /** Only include products with non-null, non-empty names */
  excludeEmptyNames?: boolean
  /** Only include products with active discounts (discount > 0) */
  onlyDiscounted?: boolean
  /** Only include tracked products (priority 1-5) */
  onlyTracked?: boolean
  /** Only include available products (available = true) */
  onlyAvailable?: boolean
}

// ============================================================================
// Main Query Params Type
// ============================================================================

/**
 * Complete store products query parameters
 * All properties are optional - defaults are applied in the query function
 */
export interface StoreProductsQueryParams {
  /** Text search filter */
  search?: TextSearchFilter

  /** Category filter (store-specific categories) */
  categories?: CategoryFilter

  /** Canonical category filter (unified categories across stores) */
  canonicalCategory?: CanonicalCategoryFilter

  /** Origin/store filter */
  origin?: OriginFilter

  /** Priority filter */
  priority?: PriorityFilter

  /** Priority source filter (ai/manual) */
  source?: SourceFilter

  /** Sorting options */
  sort?: SortOptions

  /** Pagination options (defaults to page 1, limit 36) */
  pagination?: PaginationOptions

  /** Additional filter flags */
  flags?: FilterFlags

  /** User ID for favorite status augmentation (optional) */
  userId?: string | null
}

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Extended store product with computed fields
 */
export interface StoreProductWithMeta extends StoreProduct {
  /** Whether the current user has favorited this product */
  is_favorited?: boolean
}

/**
 * Pagination metadata returned with query results.
 * totalCount and totalPages are null when using the fast limit+1 pattern
 * (avoids expensive COUNT(*) OVER() on large tables).
 */
export interface PaginationMeta {
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items matching the query (null when count is skipped for performance) */
  totalCount: number | null
  /** Total number of pages (null when count is skipped for performance) */
  totalPages: number | null
  /** Whether there are more pages after this one */
  hasNextPage: boolean
  /** Whether there are pages before this one */
  hasPreviousPage: boolean
}

/**
 * Complete query result
 */
export interface StoreProductsQueryResult {
  /** Array of store products */
  data: StoreProductWithMeta[]
  /** Pagination metadata */
  pagination: PaginationMeta
  /** Error information if query failed */
  error: { message: string; code?: string } | null
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PAGINATION: PaginationOptions = {
  page: 1,
  limit: 40,
}

export const DEFAULT_SORT: SortOptions = {
  sortBy: "a-z",
  prioritizeByPriority: false,
}

export const DEFAULT_FLAGS: FilterFlags = {
  excludeEmptyNames: true,
  onlyDiscounted: false,
  onlyTracked: false,
  onlyAvailable: true,
}

// ============================================================================
// Query Key Generation (for React Query)
// ============================================================================

type QueryKeyValue = string | number | boolean | null

/**
 * Generates a stable, serializable query key for React Query caching
 * Ensures consistent key generation regardless of property order
 */
export function generateQueryKey(params: StoreProductsQueryParams): QueryKeyValue[] {
  // Helper to normalize origin IDs to a stable string
  const getOriginKey = (): QueryKeyValue => {
    if (!params.origin?.originIds) return null
    const ids = params.origin.originIds
    if (Array.isArray(ids)) {
      return [...ids].sort((a, b) => a - b).join(",")
    }
    return ids
  }

  // Helper to normalize priority values to a stable string
  const getPriorityKey = (): QueryKeyValue => {
    if (!params.priority?.values) return null
    return params.priority.values
      .map((v) => (v === null ? "null" : v))
      .sort()
      .join(",")
  }

  // Helper to normalize source values to a stable string
  const getSourceKey = (): QueryKeyValue => {
    if (!params.source?.values) return null
    return [...params.source.values].sort().join(",")
  }

  // Helper to normalize categories to a stable string
  const getCategoriesKey = (): QueryKeyValue => {
    if (!params.categories?.categories) return null
    return [...params.categories.categories].sort().join(",")
  }

  // Helper to normalize tuples to a stable string
  const getTuplesKey = (): QueryKeyValue => {
    if (!params.categories?.tuples?.length) return null
    return params.categories.tuples
      .map((t) => `${t.category}|${t.category_2}|${t.category_3 ?? ""}`)
      .sort()
      .join(";")
  }

  return [
    "storeProducts",
    // Search
    params.search?.query ?? null,
    params.search?.searchIn ?? null,
    // Categories (flat)
    getCategoriesKey(),
    // Categories (hierarchy)
    params.categories?.hierarchy?.category1 ?? null,
    params.categories?.hierarchy?.category2 ?? null,
    params.categories?.hierarchy?.category3 ?? null,
    // Categories (tuples)
    getTuplesKey(),
    // Canonical category
    params.canonicalCategory?.categoryId ?? null,
    // Origin
    getOriginKey(),
    // Priority
    getPriorityKey(),
    // Source
    getSourceKey(),
    // Sort
    params.sort?.sortBy ?? DEFAULT_SORT.sortBy,
    params.sort?.prioritizeByPriority ?? false,
    // Pagination
    params.pagination?.page ?? DEFAULT_PAGINATION.page,
    params.pagination?.limit ?? DEFAULT_PAGINATION.limit,
    // Flags (use explicit false for undefined to ensure consistent keys)
    params.flags?.excludeEmptyNames ?? true,
    params.flags?.onlyDiscounted ?? false,
    params.flags?.onlyTracked ?? false,
    params.flags?.onlyAvailable ?? true,
    // User
    params.userId ?? null,
  ]
}
