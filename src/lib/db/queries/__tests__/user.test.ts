import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockUser } from "./mocks/supabase"

// Mock Supabase clients
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}))

import { userQueries } from "../user"

describe("userQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getCurrentUser", () => {
    it("should return user when authenticated", async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await userQueries.getCurrentUser()

      expect(result.data).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it("should return error when not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await userQueries.getCurrentUser()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: "Unauthorized", code: "UNAUTHORIZED" })
    })

    it("should return error when auth fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth error" },
      })

      const result = await userQueries.getCurrentUser()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: "Unauthorized", code: "UNAUTHORIZED" })
    })
  })

  describe("requireAuth", () => {
    it("should return user when authenticated", async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await userQueries.requireAuth()

      expect(result).toEqual(mockUser)
    })

    it("should throw error when not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(userQueries.requireAuth()).rejects.toThrow("Authentication required")
    })
  })

  describe("checkUserPermission", () => {
    it("should return true when user owns resource", async () => {
      const mockUser = createMockUser({ id: "user-123" })
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await userQueries.checkUserPermission("user-123", "user-123")

      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it("should return forbidden when user does not own resource", async () => {
      const mockUser = createMockUser({ id: "user-123" })
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await userQueries.checkUserPermission("user-123", "other-user")

      expect(result.data).toBe(false)
      expect(result.error).toEqual({ message: "Forbidden", code: "FORBIDDEN" })
    })

    it("should return unauthorized when not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await userQueries.checkUserPermission("user-123", "user-123")

      expect(result.data).toBe(false)
      expect(result.error).toEqual({ message: "Unauthorized", code: "UNAUTHORIZED" })
    })
  })

  describe("createPaginationParams", () => {
    it("should parse page and limit from search params", () => {
      const params = new URLSearchParams("page=3&limit=50")

      const result = userQueries.createPaginationParams(params)

      expect(result).toEqual({ page: 3, limit: 50 })
    })

    it("should use defaults when params are missing", () => {
      const params = new URLSearchParams()

      const result = userQueries.createPaginationParams(params)

      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it("should handle invalid values as NaN", () => {
      const params = new URLSearchParams("page=invalid&limit=bad")

      const result = userQueries.createPaginationParams(params)

      expect(result.page).toBeNaN()
      expect(result.limit).toBeNaN()
    })
  })

  describe("calculatePagination", () => {
    it("should calculate pagination correctly", () => {
      const result = userQueries.calculatePagination(2, 10, 45)

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 45,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      })
    })

    it("should handle first page", () => {
      const result = userQueries.calculatePagination(1, 10, 45)

      expect(result.hasNextPage).toBe(true)
      expect(result.hasPreviousPage).toBe(false)
    })

    it("should handle last page", () => {
      const result = userQueries.calculatePagination(5, 10, 45)

      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(true)
    })

    it("should handle single page", () => {
      const result = userQueries.calculatePagination(1, 10, 5)

      expect(result.totalPages).toBe(1)
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(false)
    })

    it("should handle empty results", () => {
      const result = userQueries.calculatePagination(1, 10, 0)

      expect(result.totalPages).toBe(0)
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(false)
    })
  })

  describe("createPaginatedResult", () => {
    it("should create paginated result with data", () => {
      const data = [{ id: 1 }, { id: 2 }]

      const result = userQueries.createPaginatedResult(data, 1, 10, 2)

      expect(result.data).toEqual(data)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.total).toBe(2)
      expect(result.error).toBeNull()
    })
  })

  describe("createErrorResult", () => {
    it("should create error result", () => {
      const result = userQueries.createErrorResult<string>("Something went wrong", "ERROR_CODE")

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: "Something went wrong", code: "ERROR_CODE" })
    })

    it("should create error result without code", () => {
      const result = userQueries.createErrorResult<string>("Something went wrong")

      expect(result.error).toEqual({ message: "Something went wrong", code: undefined })
    })
  })

  describe("createPaginatedErrorResult", () => {
    it("should create paginated error result", () => {
      const result = userQueries.createPaginatedErrorResult<string>("Query failed", "DB_ERROR")

      expect(result.data).toEqual([])
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.total).toBe(0)
      expect(result.error).toEqual({ message: "Query failed", code: "DB_ERROR" })
    })
  })
})
