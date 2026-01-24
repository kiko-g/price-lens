import type { SearchType, SortByType } from "@/types/business"

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Generic query result types
export interface QueryResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

export interface PaginatedQueryResult<T> {
  data: T[]
  pagination: PaginationResult
  error: { message: string; code?: string } | null
}

// Store products query params
export type GetAllQuery = {
  page: number
  limit: number
  tracked?: boolean // priority 3, 4, 5 (or more if needed in the future)
  priority?: string // Comma-separated: "1,2,3" for numbers, "none" for null, "none,3,4" for mixed
  query?: string
  sort?: SortByType
  searchType?: SearchType
  nonNulls?: boolean
  categories?: string[]
  category?: string | null
  category2?: string | null
  category3?: string | null
  origin?: string // Comma-separated: "1,2,3" for multiple origins
  userId?: string | null
  orderByPriority?: boolean
  options?: {
    onlyDiscounted: boolean
  }
}
