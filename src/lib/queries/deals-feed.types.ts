import type { StoreProductWithMeta } from "@/lib/queries/store-products/types"

export interface DealsFeedPagination {
  page: number
  limit: number
  totalCount: null
  totalPages: null
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DealsFeedResult {
  data: StoreProductWithMeta[]
  pagination: DealsFeedPagination
  error: { message: string; code?: string } | null
}

export interface QueryDealsFeedParams {
  page?: number
  limit?: number
  originId?: number
}
