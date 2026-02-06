import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import type {
  StoreProductsQueryParams,
  StoreProductsQueryResult,
  StoreProductWithMeta,
} from "@/lib/queries/store-products/types"
import { generateQueryKey, DEFAULT_PAGINATION } from "@/lib/queries/store-products/types"

// ============================================================================
// API Functions
// ============================================================================

/**
 * Converts the structured params to URL search params for the API
 */
function paramsToSearchParams(params: StoreProductsQueryParams): Record<string, string> {
  const searchParams: Record<string, string> = {}

  // Search
  if (params.search?.query) {
    searchParams.q = params.search.query
    searchParams.searchType = params.search.searchIn
  }

  // Categories (tuples take precedence, then hierarchy, then flat list)
  if (params.categories?.tuples?.length) {
    // Format: cat1|cat2|cat3;cat1|cat2|cat3
    searchParams.catTuples = params.categories.tuples
      .map((t) => `${t.category}|${t.category_2}|${t.category_3 ?? ""}`)
      .join(";")
  } else if (params.categories?.hierarchy) {
    const { category1, category2, category3 } = params.categories.hierarchy
    if (category1) searchParams.category = category1
    if (category2) searchParams.category_2 = category2
    if (category3) searchParams.category_3 = category3
  } else if (params.categories?.categories?.length) {
    searchParams.categories = params.categories.categories.join(";")
  }

  // Origin
  if (params.origin?.originIds) {
    const ids = params.origin.originIds
    searchParams.origin = Array.isArray(ids) ? ids.join(",") : String(ids)
  }

  // Priority
  if (params.priority?.values?.length) {
    searchParams.priority = params.priority.values.map((v) => (v === null ? "none" : String(v))).join(",")
  }

  // Source (priority_source)
  if (params.source?.values?.length) {
    searchParams.source = params.source.values.join(",")
  }

  // Canonical category
  if (params.canonicalCategory?.categoryId) {
    searchParams.canonicalCat = String(params.canonicalCategory.categoryId)
  }

  // Sort
  if (params.sort?.sortBy) {
    searchParams.sort = params.sort.sortBy
  }
  if (params.sort?.prioritizeByPriority) {
    searchParams.orderByPriority = "true"
  }

  // Pagination
  searchParams.page = String(params.pagination?.page ?? DEFAULT_PAGINATION.page)
  searchParams.limit = String(params.pagination?.limit ?? DEFAULT_PAGINATION.limit)

  // Flags
  if (params.flags?.onlyDiscounted) {
    searchParams.onlyDiscounted = "true"
  }
  if (params.flags?.onlyAvailable === false) {
    searchParams.onlyAvailable = "false"
  }

  return searchParams
}

/**
 * Fetches store products from the API
 */
async function fetchStoreProducts(params: StoreProductsQueryParams): Promise<StoreProductsQueryResult> {
  const searchParams = paramsToSearchParams(params)

  const response = await axios.get("/api/store_products", { params: searchParams })

  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }

  const data = response.data

  // Transform API response to our result type
  return {
    data: data.data as StoreProductWithMeta[],
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      totalCount: data.pagination.pagedCount,
      totalPages: data.pagination.totalPages,
      hasNextPage: data.pagination.page < data.pagination.totalPages,
      hasPreviousPage: data.pagination.page > 1,
    },
    error: null,
  }
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseStoreProductsOptions {
  /** Whether the query should be enabled (default: true) */
  enabled?: boolean
  /** Initial data to use before the query completes */
  initialData?: StoreProductsQueryResult
  /** Stale time in milliseconds (default: 2 minutes) */
  staleTime?: number
  /** Whether to refetch on window focus (default: false) */
  refetchOnWindowFocus?: boolean
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * React hook for fetching store products with filtering, sorting, and pagination
 *
 * @example
 * ```tsx
 * import { useStoreProducts, SupermarketChain } from "@/hooks/useStoreProducts"
 *
 * function ProductGrid() {
 *   const { data, isLoading, error, pagination } = useStoreProducts({
 *     search: { query: "leite", searchIn: "any" },
 *     origin: { originIds: SupermarketChain.Continente },
 *     pagination: { page: 1, limit: 36 },
 *   })
 *
 *   if (isLoading) return <Skeleton />
 *   if (error) return <ErrorMessage error={error} />
 *
 *   return (
 *     <div>
 *       {data.map(product => <ProductCard key={product.id} product={product} />)}
 *       <Pagination {...pagination} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useStoreProducts(params: StoreProductsQueryParams = {}, options: UseStoreProductsOptions = {}) {
  const {
    enabled = true,
    initialData,
    staleTime = 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus = false,
  } = options

  const queryKey = generateQueryKey(params)

  const query = useQuery({
    queryKey,
    queryFn: () => fetchStoreProducts(params),
    enabled,
    staleTime,
    refetchOnWindowFocus,
    refetchOnReconnect: false,
    initialData,
    placeholderData: keepPreviousData,
  })

  // Extract convenient values from the result
  const result = query.data

  return {
    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    error: query.error,

    // Data
    data: result?.data ?? [],
    pagination: result?.pagination ?? null,

    // Raw query result (for advanced use cases)
    rawResult: result,

    // Query utilities
    refetch: query.refetch,
  }
}

// ============================================================================
// Return Type (for external use)
// ============================================================================

export type UseStoreProductsReturn = ReturnType<typeof useStoreProducts>

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { SupermarketChain, generateQueryKey } from "@/lib/queries/store-products/types"
export type {
  StoreProductsQueryParams,
  StoreProductWithMeta,
  PaginationMeta,
  TextSearchFilter,
  CategoryFilter,
  CanonicalCategoryFilter,
  OriginFilter,
  PriorityFilter,
  SortOptions,
  FilterFlags,
} from "@/lib/queries/store-products/types"

// ============================================================================
// Additional Utility Hooks
// ============================================================================

/**
 * Hook to invalidate store products queries
 * Useful after mutations that affect product data
 */
export function useInvalidateStoreProducts() {
  const queryClient = useQueryClient()

  return {
    /** Invalidate all store products queries */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
    },
    /** Invalidate a specific query by params */
    invalidate: (params: StoreProductsQueryParams) => {
      queryClient.invalidateQueries({ queryKey: generateQueryKey(params) })
    },
  }
}

/**
 * Hook to update a store product's priority
 */
export function useUpdateStoreProductPriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storeProductId, priority }: { storeProductId: number; priority: number | null }) => {
      const response = await axios.put(`/api/store_products/${storeProductId}/priority`, {
        priority,
      })
      if (response.status !== 200) {
        throw new Error(response.data?.error || "Failed to update priority")
      }
      return response.data
    },
    onSuccess: (_data, variables) => {
      const { storeProductId, priority } = variables
      toast.success("Priority updated", {
        description: `Product priority set to ${priority === null ? "none" : priority}`,
      })
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["storeProduct", storeProductId.toString()] })
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
    },
    onError: (error) => {
      toast.error("Failed to update priority", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    },
  })
}
