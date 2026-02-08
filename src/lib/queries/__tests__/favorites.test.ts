import { describe, it, expect, vi, beforeEach } from "vitest"
import { favoriteQueries } from "@/lib/queries/favorites"
import { createMockFavorite, createMockStoreProduct } from "./mocks/supabase"

// Create chainable query mock that properly chains all methods
const createChainMock = () => {
  const chain: any = {}

  // All chainable methods return the chain itself
  const chainableMethods = ["select", "insert", "delete", "eq", "in", "order", "range"]
  chainableMethods.forEach((method) => {
    chain[method] = vi.fn().mockImplementation(() => chain)
  })

  // Terminal methods that resolve
  chain.single = vi.fn()
  chain._result = { data: null, error: null, count: null }

  return chain
}

let mockChain = createChainMock()

const mockSupabase = {
  from: vi.fn(() => mockChain),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}))

describe("favoriteQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createChainMock()
    mockSupabase.from.mockReturnValue(mockChain)
  })

  describe("addFavorite", () => {
    it("should add a new favorite successfully", async () => {
      const mockFavorite = createMockFavorite()

      // First call - check if exists (returns null)
      mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      // Second call - insert
      mockChain.single.mockResolvedValueOnce({ data: mockFavorite, error: null })

      const result = await favoriteQueries.addFavorite("user-123", 1)

      expect(mockSupabase.from).toHaveBeenCalledWith("user_favorites")
      expect(result.data).toEqual(mockFavorite)
      expect(result.error).toBeNull()
    })

    it("should return error when product already favorited", async () => {
      const existingFavorite = createMockFavorite()
      mockChain.single.mockResolvedValueOnce({ data: existingFavorite, error: null })

      const result = await favoriteQueries.addFavorite("user-123", 1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: "Product already favorited", code: "ALREADY_FAVORITED" })
    })

    it("should handle database error on insert", async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } })

      const result = await favoriteQueries.addFavorite("user-123", 1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: "Insert failed" })
    })
  })

  describe("removeFavorite", () => {
    it("should remove favorite successfully", async () => {
      // Create a proper chain that resolves at the end
      const deleteChain: any = {}
      deleteChain.eq = vi.fn().mockImplementation(() => deleteChain)
      // Make the chain thenable (can be awaited)
      deleteChain.then = (resolve: any) => resolve({ error: null })

      mockChain.delete.mockReturnValue(deleteChain)

      const result = await favoriteQueries.removeFavorite("user-123", 1)

      expect(mockSupabase.from).toHaveBeenCalledWith("user_favorites")
      expect(result.error).toBeNull()
    })

    it("should return error on delete failure", async () => {
      const deleteChain: any = {}
      deleteChain.eq = vi.fn().mockImplementation(() => deleteChain)
      deleteChain.then = (resolve: any) => resolve({ error: { message: "Delete failed" } })

      mockChain.delete.mockReturnValue(deleteChain)

      const result = await favoriteQueries.removeFavorite("user-123", 1)

      expect(result.error).toEqual({ message: "Delete failed" })
    })
  })

  describe("isFavorited", () => {
    it("should return true when product is favorited", async () => {
      const mockFavorite = createMockFavorite()
      mockChain.single.mockResolvedValue({ data: mockFavorite, error: null })

      const result = await favoriteQueries.isFavorited("user-123", 1)

      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it("should return false when product is not favorited", async () => {
      // PGRST116 is "no rows returned" which is expected
      mockChain.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } })

      const result = await favoriteQueries.isFavorited("user-123", 1)

      expect(result.data).toBe(false)
      expect(result.error).toBeNull()
    })

    it("should return error on database failure", async () => {
      mockChain.single.mockResolvedValue({ data: null, error: { code: "DB_ERROR", message: "Connection failed" } })

      const result = await favoriteQueries.isFavorited("user-123", 1)

      expect(result.data).toBe(false)
      expect(result.error).toEqual({ code: "DB_ERROR", message: "Connection failed" })
    })
  })

  describe("getUserFavorites", () => {
    it("should return user favorites with store products", async () => {
      const mockStoreProduct = createMockStoreProduct()
      const mockFavorites = [
        {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          store_product_id: 1,
          store_products: mockStoreProduct,
        },
      ]

      mockChain.range.mockResolvedValue({ data: mockFavorites, error: null })

      const result = await favoriteQueries.getUserFavorites("user-123")

      expect(mockSupabase.from).toHaveBeenCalledWith("user_favorites")
      expect(result.data).toEqual(mockFavorites)
      expect(result.error).toBeNull()
    })

    it("should return empty array when no favorites", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null })

      const result = await favoriteQueries.getUserFavorites("user-123")

      expect(result.data).toEqual([])
    })

    it("should return error on database failure", async () => {
      mockChain.range.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await favoriteQueries.getUserFavorites("user-123")

      expect(result.error).toEqual({ message: "Query failed" })
    })
  })

  describe("getUserFavoritesPaginated", () => {
    it("should return paginated favorites", async () => {
      const mockStoreProduct = createMockStoreProduct()
      const mockFavorites = [
        {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          store_product_id: 1,
          store_products: mockStoreProduct,
        },
      ]

      mockChain.range.mockResolvedValue({ data: mockFavorites, error: null, count: 25 })

      const result = await favoriteQueries.getUserFavoritesPaginated("user-123", { page: 2, limit: 10 })

      expect(result.data).toEqual(mockFavorites)
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      })
      expect(result.error).toBeNull()
    })

    it("should use default pagination when not provided", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      const result = await favoriteQueries.getUserFavoritesPaginated("user-123")

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it("should return error result on database failure", async () => {
      mockChain.range.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await favoriteQueries.getUserFavoritesPaginated("user-123")

      expect(result.data).toEqual([])
      expect(result.error).toEqual({ message: "Query failed", code: "DATABASE_ERROR" })
      expect(result.pagination.total).toBe(0)
    })
  })

  describe("getFavoritesCount", () => {
    it("should return count of favorites", async () => {
      mockChain.eq.mockResolvedValue({ count: 15, error: null })

      const result = await favoriteQueries.getFavoritesCount("user-123")

      expect(result.count).toBe(15)
      expect(result.error).toBeNull()
    })

    it("should return 0 when no favorites", async () => {
      mockChain.eq.mockResolvedValue({ count: null, error: null })

      const result = await favoriteQueries.getFavoritesCount("user-123")

      expect(result.count).toBe(0)
    })

    it("should handle error", async () => {
      mockChain.eq.mockResolvedValue({ count: null, error: { message: "Count failed" } })

      const result = await favoriteQueries.getFavoritesCount("user-123")

      expect(result.count).toBe(0)
      expect(result.error).toEqual({ message: "Count failed" })
    })
  })

  describe("toggleFavorite", () => {
    it("should add favorite when not currently favorited", async () => {
      // isFavorited check - not found
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
      // addFavorite - check existing (not found)
      mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      // addFavorite - insert
      const mockFavorite = createMockFavorite()
      mockChain.single.mockResolvedValueOnce({ data: mockFavorite, error: null })

      const result = await favoriteQueries.toggleFavorite("user-123", 1)

      expect(result.data).toEqual({
        action: "added",
        is_favorited: true,
        favorite: mockFavorite,
      })
      expect(result.error).toBeNull()
    })

    it("should remove favorite when currently favorited", async () => {
      // isFavorited check - found
      mockChain.single.mockResolvedValueOnce({ data: { id: 1 }, error: null })

      // removeFavorite - create proper chain
      const deleteChain: any = {}
      deleteChain.eq = vi.fn().mockImplementation(() => deleteChain)
      deleteChain.then = (resolve: any) => resolve({ error: null })
      mockChain.delete.mockReturnValue(deleteChain)

      const result = await favoriteQueries.toggleFavorite("user-123", 1)

      expect(result.data).toEqual({
        action: "removed",
        is_favorited: false,
      })
      expect(result.error).toBeNull()
    })

    it("should return error when check fails", async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { code: "DB_ERROR", message: "Check failed" } })

      const result = await favoriteQueries.toggleFavorite("user-123", 1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ code: "DB_ERROR", message: "Check failed" })
    })
  })
})
