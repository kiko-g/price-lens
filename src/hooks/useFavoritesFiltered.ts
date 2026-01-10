import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import axios from "axios"
import type {
  FavoritesQueryParams,
  FavoriteWithProduct,
  FavoritesQueryResult,
  FavoritesSortType,
} from "@/lib/db/queries/favorites"
import { SupermarketChain } from "@/types/business"

// ============================================================================
// API Functions
// ============================================================================

/**
 * Converts the structured params to URL search params for the API
 */
function paramsToSearchParams(params: FavoritesQueryParams): Record<string, string> {
  const searchParams: Record<string, string> = {}

  // Search
  if (params.search?.query) {
    searchParams.q = params.search.query
    searchParams.searchType = params.search.searchIn
  }

  // Origin
  if (params.origin?.originIds) {
    const ids = params.origin.originIds
    searchParams.origin = Array.isArray(ids) ? ids.join(",") : String(ids)
  }

  // Sort
  if (params.sort?.sortBy) {
    searchParams.sort = params.sort.sortBy
  }

  // Pagination
  searchParams.page = String(params.pagination?.page ?? 1)
  searchParams.limit = String(params.pagination?.limit ?? 24)

  // Flags
  if (params.flags?.onlyDiscounted) {
    searchParams.onlyDiscounted = "true"
  }

  return searchParams
}

/**
 * Fetches favorites from the API
 */
async function fetchFavorites(params: FavoritesQueryParams): Promise<FavoritesQueryResult> {
  const searchParams = paramsToSearchParams(params)
  const response = await axios.get("/api/favorites", { params: searchParams })

  if (response.status !== 200) {
    throw new Error("Failed to fetch favorites")
  }

  return response.data as FavoritesQueryResult
}

// ============================================================================
// Query Key Generation
// ============================================================================

type QueryKeyValue = string | number | boolean | null

function generateQueryKey(params: FavoritesQueryParams): QueryKeyValue[] {
  const getOriginKey = (): QueryKeyValue => {
    if (!params.origin?.originIds) return null
    const ids = params.origin.originIds
    if (Array.isArray(ids)) {
      return [...ids].sort((a, b) => a - b).join(",")
    }
    return ids
  }

  return [
    "favorites",
    params.search?.query ?? null,
    params.search?.searchIn ?? null,
    getOriginKey(),
    params.sort?.sortBy ?? "recently-added",
    params.pagination?.page ?? 1,
    params.pagination?.limit ?? 24,
    params.flags?.onlyDiscounted ?? false,
  ]
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseFavoritesFilteredOptions {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * React hook for fetching favorites with filtering, sorting, and pagination
 *
 * @example
 * ```tsx
 * import { useFavoritesFiltered } from "@/hooks/useFavoritesFiltered"
 *
 * function FavoritesGrid() {
 *   const { data, isLoading, pagination } = useFavoritesFiltered({
 *     search: { query: "leite", searchIn: "any" },
 *     origin: { originIds: SupermarketChain.Continente },
 *     pagination: { page: 1, limit: 24 },
 *   })
 *
 *   if (isLoading) return <Skeleton />
 *   return <Grid items={data} />
 * }
 * ```
 */
export function useFavoritesFiltered(params: FavoritesQueryParams = {}, options: UseFavoritesFilteredOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 2, refetchOnWindowFocus = false } = options

  const queryKey = generateQueryKey(params)

  const query = useQuery({
    queryKey,
    queryFn: () => fetchFavorites(params),
    enabled,
    staleTime,
    refetchOnWindowFocus,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  })

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

    // Raw query result
    rawResult: result,

    // Query utilities
    refetch: query.refetch,
  }
}

// ============================================================================
// Return Type
// ============================================================================

export type UseFavoritesFilteredReturn = ReturnType<typeof useFavoritesFiltered>

// ============================================================================
// Re-exports
// ============================================================================

export { SupermarketChain }
export type { FavoritesQueryParams, FavoriteWithProduct, FavoritesSortType }

// ============================================================================
// Utility Hook: Invalidate Favorites
// ============================================================================

export function useInvalidateFavorites() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
    },
    invalidate: (params: FavoritesQueryParams) => {
      queryClient.invalidateQueries({ queryKey: generateQueryKey(params) })
    },
  }
}
