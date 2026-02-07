import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import type { StoreProduct } from "@/types"

export type TrackedProductsPagination = {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export type TrackedProductsPage = {
  products: StoreProduct[]
  pagination: TrackedProductsPagination
}

// Priority filter can be numbers (0-5) or "none" for null priorities
export type PriorityFilterValue = number | "none" | "all"

type TrackedProductsParams = {
  query: string
  origin: number[]
  priority: PriorityFilterValue[]
  limit?: number
}

async function fetchTrackedProducts({
  page,
  query,
  origin,
  priority,
  limit = 30,
}: TrackedProductsParams & { page: number }): Promise<TrackedProductsPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    tracked: "true",
    ...(query && { query }),
    ...(origin.length > 0 && { origin: origin.join(",") }),
    ...(priority.length > 0 && { priority: priority.join(",") }),
  })

  const response = await axios.get(`/api/store_products?${params}`)

  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }

  const data = response.data

  return {
    products: data.data || [],
    pagination: {
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalCount: data.pagination?.pagedCount ?? 0,
      totalPages: data.pagination?.totalPages ?? 0,
      hasMore: data.pagination?.hasNextPage ?? false,
    },
  }
}

type UseTrackedProductsOptions = {
  query: string
  origin?: number[]
  priority?: PriorityFilterValue[]
  limit?: number
  initialData?: TrackedProductsPage
}

export function useTrackedProducts({
  query,
  origin = [],
  priority = [],
  limit = 30,
  initialData,
}: UseTrackedProductsOptions) {
  const queryClient = useQueryClient()

  // Create stable keys for array filters
  const originKey = origin.length > 0 ? [...origin].sort().join(",") : ""
  const priorityKey = priority.length > 0 ? [...priority].sort().join(",") : ""

  console.debug("[useTrackedProducts] params:", { query, origin, originKey, priority, priorityKey })

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["trackedProducts", query, originKey, priorityKey, limit],
    queryFn: ({ pageParam }) => fetchTrackedProducts({ page: pageParam, query, origin, priority, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined),
    // Force refetch when filters change (don't use cached data)
    staleTime: 0,
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [1],
        }
      : undefined,
  })

  // Flatten all pages into a single array of products
  const products = infiniteQuery.data?.pages.flatMap((page) => page.products) ?? []

  // Get the latest pagination info
  const latestPage = infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]
  const pagination: TrackedProductsPagination = latestPage?.pagination ?? {
    page: 1,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  }

  // Prefetch the next page for better UX
  const prefetchNextPage = () => {
    if (!pagination.hasMore || infiniteQuery.isFetchingNextPage) return

    const nextPage = pagination.page + 1
    queryClient.prefetchInfiniteQuery({
      queryKey: ["trackedProducts", query, originKey, priorityKey, limit],
      queryFn: ({ pageParam }) => fetchTrackedProducts({ page: pageParam, query, origin, priority, limit }),
      initialPageParam: nextPage,
    })
  }

  return {
    products,
    pagination,
    isLoading: infiniteQuery.isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    prefetchNextPage,
    error: infiniteQuery.error,
    isError: infiniteQuery.isError,
  }
}
