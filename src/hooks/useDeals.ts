import { useQuery, keepPreviousData } from "@tanstack/react-query"
import axios, { isAxiosError } from "axios"

import type { StoreProductWithMeta } from "@/lib/queries/store-products/types"
import { DEFAULT_DEALS_PAGE_LIMIT } from "@/lib/queries/deals-constants"

export interface DealsQueryParams {
  page: number
  limit?: number
  /** Single origin id; omit for all stores */
  origin?: number
}

export interface DealsPagination {
  page: number
  limit: number
  pagedCount: number | null
  totalPages: number | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DealsQueryResult {
  data: StoreProductWithMeta[]
  pagination: DealsPagination
}

function paramsToSearchParams(params: DealsQueryParams): Record<string, string> {
  const searchParams: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit ?? DEFAULT_DEALS_PAGE_LIMIT),
  }
  if (params.origin != null) {
    searchParams.origin = String(params.origin)
  }
  return searchParams
}

export function generateDealsQueryKey(params: DealsQueryParams): readonly unknown[] {
  return ["deals", params.page, params.limit ?? DEFAULT_DEALS_PAGE_LIMIT, params.origin ?? "all"] as const
}

export async function fetchDeals(params: DealsQueryParams): Promise<DealsQueryResult> {
  const searchParams = paramsToSearchParams(params)
  try {
    const response = await axios.get("/api/deals", { params: searchParams })

    if (response.status !== 200) {
      throw new Error("Failed to fetch deals")
    }

    const body = response.data
    return {
      data: body.data as StoreProductWithMeta[],
      pagination: {
        page: body.pagination.page,
        limit: body.pagination.limit,
        pagedCount: body.pagination.pagedCount ?? null,
        totalPages: body.pagination.totalPages ?? null,
        hasNextPage: body.pagination.hasNextPage ?? false,
        hasPreviousPage: body.pagination.hasPreviousPage ?? false,
      },
    }
  } catch (e) {
    if (isAxiosError(e) && e.response?.data && typeof e.response.data === "object" && "error" in e.response.data) {
      const msg = (e.response.data as { error?: string }).error
      if (msg) throw new Error(msg)
    }
    throw e instanceof Error ? e : new Error("Failed to fetch deals")
  }
}

type UseDealsOptions = {
  enabled?: boolean
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

export function useDeals(params: DealsQueryParams, options: UseDealsOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 2, refetchOnWindowFocus = false } = options

  const queryKey = generateDealsQueryKey(params)

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDeals(params),
    enabled,
    staleTime,
    refetchOnWindowFocus,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  })

  const result = query.data

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    data: result?.data ?? [],
    pagination: result?.pagination ?? null,
    refetch: query.refetch,
  }
}
