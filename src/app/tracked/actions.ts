import { storeProductQueries } from "@/lib/db/queries/products"
import { createClient } from "@/lib/supabase/server"
import type { StoreProduct } from "@/types"

export type TrackedProductsResult = {
  products: StoreProduct[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export async function getTrackedProducts({
  page = 1,
  limit = 30,
  query = "",
  origin = 0,
}: {
  page?: number
  limit?: number
  query?: string
  origin?: number
}): Promise<TrackedProductsResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error, count } = await storeProductQueries.getAll({
    page,
    limit,
    query,
    searchType: "any",
    sort: "a-z",
    tracked: true,
    origin: origin !== 0 ? origin : null,
    userId: user?.id || null,
    orderByPriority: true,
  })

  if (error || !data) {
    console.error("Error fetching tracked products:", error)
    return {
      products: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)
  const hasMore = page < totalPages

  return {
    products: data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasMore,
    },
  }
}
