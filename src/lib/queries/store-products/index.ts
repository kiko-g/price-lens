/**
 * Store Products Query Module
 *
 * A robust, type-safe system for querying store products with support for:
 * - Text search (multi-field or single field)
 * - Category filtering (flat or hierarchical)
 * - Origin/store filtering (single or multi-select)
 * - Priority filtering (including null for unclassified)
 * - Sorting (name, price, with optional priority ordering)
 * - Pagination
 * - User-specific augmentation (favorites)
 *
 * @example
 * ```ts
 * import { queryStoreProducts, SupermarketChain } from "@/lib/queries/store-products"
 *
 * const result = await queryStoreProducts({
 *   search: { query: "leite", searchIn: "any" },
 *   origin: { originIds: SupermarketChain.Continente },
 *   pagination: { page: 1, limit: 20 },
 *   sort: { sortBy: "price-low-high" },
 * })
 * ```
 */

// Query functions
export {
  queryStoreProducts,
  getMatchingProductsCount,
  getMatchingProductsWithDistribution,
  bulkUpdatePriority,
} from "./query"
export type {
  BulkPriorityUpdateParams,
  BulkPriorityUpdateResult,
  PriorityDistribution,
  PriorityDistributionResult,
} from "./query"

// Types
export type {
  // Filter types
  TextSearchFilter,
  CategoryFilter,
  CategoryTuple,
  OriginFilter,
  PriorityFilter,
  SourceFilter,
  SortOptions,
  PaginationOptions,
  FilterFlags,
  // Main query params
  StoreProductsQueryParams,
  // Result types
  StoreProductWithMeta,
  PaginationMeta,
  StoreProductsQueryResult,
} from "./types"

// Constants and utilities
export { SupermarketChain, DEFAULT_PAGINATION, DEFAULT_SORT, DEFAULT_FLAGS, generateQueryKey } from "./types"
