import { createClient } from "@/lib/supabase/server"
import { createClient as createClientBrowser } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

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

export interface QueryResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

export interface PaginatedQueryResult<T> {
  data: T[]
  pagination: PaginationResult
  error: { message: string; code?: string } | null
}

export const userQueries = {
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(isServer = true): Promise<QueryResult<User>> {
    const supabase = isServer ? createClient() : createClientBrowser()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        data: null,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      }
    }

    return { data: user, error: null }
  },

  /**
   * Require authentication - throws if user is not authenticated
   */
  async requireAuth(isServer = true): Promise<User> {
    const { data: user, error } = await this.getCurrentUser(isServer)

    if (error || !user) {
      throw new Error("Authentication required")
    }

    return user
  },

  /**
   * Check if user has permission to access resource
   */
  async checkUserPermission(userId: string, resourceUserId: string, isServer = true): Promise<QueryResult<boolean>> {
    const { data: user, error } = await this.getCurrentUser(isServer)

    if (error || !user) {
      return {
        data: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      }
    }

    if (user.id !== resourceUserId) {
      return {
        data: false,
        error: { message: "Forbidden", code: "FORBIDDEN" },
      }
    }

    return { data: true, error: null }
  },

  /**
   * Create pagination parameters from URL search params
   */
  createPaginationParams(searchParams: URLSearchParams): PaginationParams {
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    return { page, limit }
  },

  /**
   * Calculate pagination result
   */
  calculatePagination(page: number, limit: number, totalCount: number): PaginationResult {
    const totalPages = Math.ceil(totalCount / limit)

    return {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  },

  /**
   * Create paginated query result
   */
  createPaginatedResult<T>(data: T[], page: number, limit: number, totalCount: number): PaginatedQueryResult<T> {
    return {
      data,
      pagination: this.calculatePagination(page, limit, totalCount),
      error: null,
    }
  },

  /**
   * Create error result
   */
  createErrorResult<T>(message: string, code?: string): QueryResult<T> {
    return {
      data: null,
      error: { message, code },
    }
  },

  /**
   * Create paginated error result
   */
  createPaginatedErrorResult<T>(message: string, code?: string): PaginatedQueryResult<T> {
    return {
      data: [],
      pagination: this.calculatePagination(1, 20, 0),
      error: { message, code },
    }
  },
}
