import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockPrice } from "./mocks/supabase"

// Create chainable query mock that properly chains all methods
const createChainMock = () => {
  const chain: any = {}

  // All chainable methods return the chain itself
  const chainableMethods = ["select", "insert", "update", "delete", "eq", "order", "range", "limit"]
  chainableMethods.forEach((method) => {
    chain[method] = vi.fn().mockImplementation(() => chain)
  })

  // Terminal methods that resolve
  chain.single = vi.fn()

  return chain
}

let mockChain = createChainMock()

const mockSupabase = {
  from: vi.fn(() => mockChain),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

vi.mock("@/lib/pricing", () => ({
  arePricePointsEqual: vi.fn((p1, p2) => {
    if (!p1 || !p2) return false
    return (
      p1.price === p2.price &&
      p1.price_recommended === p2.price_recommended &&
      p1.price_per_major_unit === p2.price_per_major_unit
    )
  }),
}))

vi.mock("@/lib/utils", () => ({
  now: () => "2024-01-15T12:00:00Z",
}))

import { priceQueries } from "../prices"

describe("priceQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createChainMock()
    mockSupabase.from.mockReturnValue(mockChain)
  })

  describe("getPrices", () => {
    it("should return all prices", async () => {
      const mockPrices = [createMockPrice({ id: 1 }), createMockPrice({ id: 2 })]
      mockChain.select.mockResolvedValue({ data: mockPrices, error: null })

      const result = await priceQueries.getPrices()

      expect(mockSupabase.from).toHaveBeenCalledWith("prices")
      expect(result).toEqual(mockPrices)
    })

    it("should return null on error", async () => {
      mockChain.select.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await priceQueries.getPrices()

      expect(result).toBeNull()
    })
  })

  describe("getPricePointsPerIndividualProduct", () => {
    it("should return price points ordered by created_at", async () => {
      const mockPrices = [
        createMockPrice({ id: 1, created_at: "2024-01-01T00:00:00Z" }),
        createMockPrice({ id: 2, created_at: "2024-01-02T00:00:00Z" }),
      ]
      mockChain.order.mockResolvedValue({ data: mockPrices, error: null })

      const result = await priceQueries.getPricePointsPerIndividualProduct(1)

      expect(mockSupabase.from).toHaveBeenCalledWith("prices")
      expect(mockChain.eq).toHaveBeenCalledWith("store_product_id", 1)
      expect(result).toEqual(mockPrices)
    })

    it("should return null on error", async () => {
      mockChain.order.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await priceQueries.getPricePointsPerIndividualProduct(1)

      expect(result).toBeNull()
    })
  })

  describe("getPricePointsWithAnalytics", () => {
    it("should return empty analytics when no prices", async () => {
      mockChain.order.mockResolvedValue({ data: [], error: null })

      const result = await priceQueries.getPricePointsWithAnalytics(1)

      expect(result).toEqual({
        prices: [],
        analytics: {
          pricePoints: null,
          mostCommon: null,
          floor: 0,
          ceiling: 0,
          variations: {
            price: 0,
            priceRecommended: 0,
            pricePerMajorUnit: 0,
            discount: 0,
          },
          dateRange: {
            minDate: null,
            maxDate: null,
            daysBetween: 0,
          },
        },
      })
    })

    it("should compute analytics from price points", async () => {
      const mockPrices = [
        createMockPrice({
          id: 1,
          price: 10.0,
          price_recommended: 12.0,
          price_per_major_unit: 10.0,
          discount: 17,
          valid_from: "2024-01-01T00:00:00Z",
          valid_to: "2024-01-05T00:00:00Z",
        }),
        createMockPrice({
          id: 2,
          price: 11.0,
          price_recommended: 12.0,
          price_per_major_unit: 11.0,
          discount: 8,
          valid_from: "2024-01-05T00:00:00Z",
          valid_to: null,
        }),
      ]
      mockChain.order.mockResolvedValue({ data: mockPrices, error: null })

      const result = await priceQueries.getPricePointsWithAnalytics(1)

      expect(result).not.toBeNull()
      expect(result!.prices).toEqual(mockPrices)
      expect(result!.analytics.floor).toBe(10)
      expect(result!.analytics.ceiling).toBe(12)
      expect(result!.analytics.pricePoints).not.toBeNull()
      expect(result!.analytics.dateRange.minDate).toBe("2024-01-01T00:00:00Z")
    })

    it("should compute variations between last two prices", async () => {
      const mockPrices = [
        createMockPrice({
          id: 1,
          price: 10.0,
          price_recommended: 12.0,
          price_per_major_unit: 10.0,
          discount: 20,
          valid_from: "2024-01-01T00:00:00Z",
          valid_to: "2024-01-05T00:00:00Z",
        }),
        createMockPrice({
          id: 2,
          price: 12.0,
          price_recommended: 14.0,
          price_per_major_unit: 12.0,
          discount: 15,
          valid_from: "2024-01-05T00:00:00Z",
          valid_to: null,
        }),
      ]
      mockChain.order.mockResolvedValue({ data: mockPrices, error: null })

      const result = await priceQueries.getPricePointsWithAnalytics(1)

      // Price went from 10 to 12, which is 20% increase
      expect(result!.analytics.variations.price).toBeCloseTo(0.2, 2)
      // Discount went from 20 to 15, which is -5 (absolute)
      expect(result!.analytics.variations.discount).toBe(-5)
    })

    it("should return null on error", async () => {
      mockChain.order.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await priceQueries.getPricePointsWithAnalytics(1)

      expect(result).toBeNull()
    })
  })

  describe("getLatestPricePoint", () => {
    it("should return the latest price point", async () => {
      const mockPrice = createMockPrice({ id: 2, created_at: "2024-01-02T00:00:00Z" })
      mockChain.single.mockResolvedValue({ data: mockPrice, error: null })

      const result = await priceQueries.getLatestPricePoint(1)

      expect(mockChain.eq).toHaveBeenCalledWith("store_product_id", 1)
      expect(mockChain.order).toHaveBeenCalledWith("valid_from", { ascending: false })
      expect(mockChain.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockPrice)
    })

    it("should return null on error", async () => {
      mockChain.single.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await priceQueries.getLatestPricePoint(1)

      expect(result).toBeNull()
    })
  })

  describe("updatePricePointUpdatedAt", () => {
    it("should update the updated_at timestamp", async () => {
      mockChain.eq.mockResolvedValue({ data: {}, error: null })

      const result = await priceQueries.updatePricePointUpdatedAt(1)

      expect(mockSupabase.from).toHaveBeenCalledWith("prices")
      expect(mockChain.update).toHaveBeenCalledWith({ updated_at: "2024-01-15T12:00:00Z" })
      expect(mockChain.eq).toHaveBeenCalledWith("id", 1)
      expect(result).toEqual({})
    })

    it("should return null on error", async () => {
      mockChain.eq.mockResolvedValue({ data: null, error: { message: "Update failed" } })

      const result = await priceQueries.updatePricePointUpdatedAt(1)

      expect(result).toBeNull()
    })
  })

  describe("closeExistingPricePoint", () => {
    it("should close all open price points and insert new one", async () => {
      const newPrice = createMockPrice({ id: 2, store_product_id: 1, valid_from: "2024-01-10T00:00:00Z" })

      // Create a more specific chain for the select after update
      const selectChain: any = {}
      selectChain.select = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })

      mockChain.is = vi.fn().mockReturnValue(selectChain)
      mockChain.insert.mockResolvedValue({ data: newPrice, error: null })

      const result = await priceQueries.closeExistingPricePoint(1, newPrice)

      expect(mockChain.update).toHaveBeenCalledWith({
        valid_to: newPrice.valid_from,
        updated_at: "2024-01-15T12:00:00Z",
      })
      expect(result).toEqual({ success: true, closedCount: 1 })
    })

    it("should return error when store_product_id is missing", async () => {
      const newPrice = createMockPrice({ id: 2, store_product_id: null })

      const result = await priceQueries.closeExistingPricePoint(1, newPrice)

      expect(result).toEqual({ success: false, closedCount: 0, error: "Missing store_product_id" })
    })

    it("should return error on update failure", async () => {
      const newPrice = createMockPrice({ id: 2, store_product_id: 1 })

      const selectChain: any = {}
      selectChain.select = vi.fn().mockResolvedValue({ data: null, error: { message: "Update failed" } })
      mockChain.is = vi.fn().mockReturnValue(selectChain)

      const result = await priceQueries.closeExistingPricePoint(1, newPrice)

      expect(result).toEqual({ success: false, closedCount: 0, error: "Update failed" })
    })
  })

  describe("insertNewPricePoint", () => {
    it("should insert a new price point", async () => {
      const newPrice = createMockPrice()
      mockChain.insert.mockResolvedValue({ data: newPrice, error: null })

      const result = await priceQueries.insertNewPricePoint(newPrice)

      expect(mockSupabase.from).toHaveBeenCalledWith("prices")
      expect(mockChain.insert).toHaveBeenCalledWith(newPrice)
      expect(result).toEqual(newPrice)
    })

    it("should return null on error", async () => {
      mockChain.insert.mockResolvedValue({ data: null, error: { message: "Insert failed" } })

      const result = await priceQueries.insertNewPricePoint(createMockPrice())

      expect(result).toBeNull()
    })
  })

  describe("deletePricePoint", () => {
    it("should delete a price point by id", async () => {
      mockChain.eq.mockResolvedValue({ data: {}, error: null })

      const result = await priceQueries.deletePricePoint(1)

      expect(mockSupabase.from).toHaveBeenCalledWith("prices")
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith("id", 1)
      expect(result).toEqual({ success: true })
    })

    it("should return error object on error", async () => {
      mockChain.eq.mockResolvedValue({ data: null, error: { message: "Delete failed" } })

      const result = await priceQueries.deletePricePoint(1)

      expect(result).toEqual({ success: false, error: "Delete failed" })
    })
  })

  describe("deleteDuplicatePricePoints", () => {
    it("should delete consecutive duplicate price points", async () => {
      const mockPrices = [
        createMockPrice({ id: 1, store_product_id: 1, price: 10, valid_from: "2024-01-03T00:00:00Z" }),
        createMockPrice({ id: 2, store_product_id: 1, price: 10, valid_from: "2024-01-02T00:00:00Z" }),
        createMockPrice({ id: 3, store_product_id: 1, price: 9, valid_from: "2024-01-01T00:00:00Z" }),
      ]

      // Create chain that handles double .order() calls
      const orderChain: any = {}
      orderChain.order = vi.fn().mockImplementation(() => orderChain)
      orderChain.then = (resolve: any) => resolve({ data: mockPrices, error: null })
      mockChain.select.mockReturnValue(orderChain)
      mockChain.eq.mockResolvedValue({ data: {}, error: null })

      await priceQueries.deleteDuplicatePricePoints()

      // Should delete the first price (id: 1) because it's equal to id: 2
      expect(mockChain.delete).toHaveBeenCalled()
    })

    it("should not delete when different products", async () => {
      const mockPrices = [
        createMockPrice({ id: 1, store_product_id: 1, price: 10 }),
        createMockPrice({ id: 2, store_product_id: 2, price: 10 }),
      ]

      const orderChain: any = {}
      orderChain.order = vi.fn().mockImplementation(() => orderChain)
      orderChain.then = (resolve: any) => resolve({ data: mockPrices, error: null })
      mockChain.select.mockReturnValue(orderChain)

      await priceQueries.deleteDuplicatePricePoints()

      // Should not delete anything because they're different products
      expect(mockChain.delete).not.toHaveBeenCalled()
    })

    it("should return error object on fetch error", async () => {
      const orderChain: any = {}
      orderChain.order = vi.fn().mockImplementation(() => orderChain)
      orderChain.then = (resolve: any) => resolve({ data: null, error: { message: "Query failed" } })
      mockChain.select.mockReturnValue(orderChain)

      const result = await priceQueries.deleteDuplicatePricePoints()

      expect(result).toEqual({ deleted: 0, error: "Failed to get duplicate stats" })
    })
  })

  describe("deleteAllPricePoints", () => {
    it("should delete all price points", async () => {
      const mockPrices = [createMockPrice({ id: 1 }), createMockPrice({ id: 2 })]
      mockChain.select.mockResolvedValueOnce({ data: mockPrices, error: null })
      mockChain.eq.mockResolvedValue({ data: {}, error: null })

      const result = await priceQueries.deleteAllPricePoints()

      expect(mockChain.delete).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockPrices)
    })

    it("should return null on fetch error", async () => {
      mockChain.select.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await priceQueries.deleteAllPricePoints()

      expect(result).toBeNull()
    })
  })
})
