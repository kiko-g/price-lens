import { storeProductQueries } from "@/lib/db/queries/products"
import { createClient } from "@/lib/supabase/server"
import type { StoreProduct } from "@/types"
import type { SearchType, SortByType } from "@/types/business"

export type SupermarketProductsResult = {
  products: StoreProduct[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export async function getSupermarketProducts({
  page = 1,
  limit = 36,
  query = "",
  searchType = "any",
  sort = "a-z",
  origin = null,
  categories = [],
  category = null,
  category2 = null,
  category3 = null,
  onlyDiscounted = false,
  orderByPriority = true,
}: {
  page?: number
  limit?: number
  query?: string
  searchType?: SearchType
  sort?: SortByType
  origin?: string | null
  categories?: string[]
  category?: string | null
  category2?: string | null
  category3?: string | null
  onlyDiscounted?: boolean
  orderByPriority?: boolean
}): Promise<SupermarketProductsResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error, count } = await storeProductQueries.getAll({
    page,
    limit,
    query,
    searchType,
    sort,
    categories,
    category,
    category2,
    category3,
    origin: origin ?? undefined,
    userId: user?.id || null,
    tracked: false,
    orderByPriority,
    options: {
      onlyDiscounted,
    },
  })

  if (error || !data) {
    console.error("Error fetching supermarket products:", error)
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
