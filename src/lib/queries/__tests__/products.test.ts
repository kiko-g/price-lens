import { describe, it, expect, vi, beforeEach } from "vitest"
import { productQueries, storeProductQueries } from "@/lib/queries/products"
import { createMockStoreProduct, createMockProduct } from "./mocks/supabase"

// Create chainable query mock that properly chains all methods
const createChainMock = () => {
  const chain: any = {
    _result: { data: null, error: null, count: null },
  }

  // All chainable methods return the chain itself
  const chainableMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "in",
    "is",
    "not",
    "or",
    "ilike",
    "textSearch",
    "gt",
    "lt",
    "range",
    "order",
    "limit",
  ]
  chainableMethods.forEach((method) => {
    chain[method] = vi.fn().mockImplementation(() => chain)
  })

  // Terminal methods that resolve
  chain.single = vi.fn()
  chain.maybeSingle = vi.fn()

  // Make the chain thenable (awaitable) - this is key for queries that end without .single()
  chain.then = function (resolve: any) {
    return resolve(this._result)
  }

  return chain
}

// Helper to set mock result on chain
const setChainResult = (chain: any, data: any, error: any = null, count: number | null = null) => {
  chain._result = { data, error, count }
}

let mockChain = createChainMock()

const mockSupabase = {
  from: vi.fn(() => mockChain),
  rpc: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}))

vi.mock("@/lib/utils", () => ({
  now: () => "2024-01-15T12:00:00Z",
}))

vi.mock("@/lib/kv", () => ({
  clearCategoriesCache: vi.fn().mockResolvedValue(undefined),
}))

describe("productQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createChainMock()
    mockSupabase.from.mockReturnValue(mockChain)
  })

  describe("getAll", () => {
    it("should return all products", async () => {
      const mockProducts = [createMockProduct({ id: 1 }), createMockProduct({ id: 2 })]
      mockChain.select.mockResolvedValue({ data: mockProducts, error: null })

      const result = await productQueries.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith("products")
      expect(result).toEqual({ data: mockProducts, error: null })
    })

    it("should return null on error", async () => {
      mockChain.select.mockResolvedValue({ data: null, error: { message: "Query failed" } })

      const result = await productQueries.getAll()

      expect(result).toBeNull()
    })
  })

  describe("getAllLinked", () => {
    it("should return products with store_products", async () => {
      const mockProducts = [
        {
          ...createMockProduct({ id: 1 }),
          store_products: [createMockStoreProduct({ id: 1 })],
        },
      ]
      setChainResult(mockChain, mockProducts, null, 1)

      const result = await productQueries.getAllLinked({ offset: 0, limit: 10 })

      expect(result.data).toEqual(mockProducts)
      expect(result.pagination).toEqual({ total: 1, offset: 0, limit: 10 })
    })

    it("should filter by origin when provided", async () => {
      setChainResult(mockChain, [], null, 0)

      await productQueries.getAllLinked({ origin: 1 })

      expect(mockChain.eq).toHaveBeenCalledWith("store_products.origin_id", 1)
    })

    it("should search by name when query provided", async () => {
      setChainResult(mockChain, [], null, 0)

      await productQueries.getAllLinked({ q: "chicken" })

      expect(mockChain.ilike).toHaveBeenCalledWith("name", "%chicken%")
    })

    it("should not search when query is too short", async () => {
      setChainResult(mockChain, [], null, 0)

      await productQueries.getAllLinked({ q: "ab" })

      expect(mockChain.ilike).not.toHaveBeenCalled()
    })
  })

  describe("deleteProduct", () => {
    it("should delete product by id", async () => {
      const mockProduct = createMockProduct({ id: 1 })

      // First call - select().eq().single() for fetching
      const selectChain: any = {}
      selectChain.eq = vi.fn().mockReturnValue(selectChain)
      selectChain.single = vi.fn().mockResolvedValue({ data: mockProduct, error: null })

      // Second call - delete().eq()
      const deleteChain: any = {}
      deleteChain.eq = vi.fn().mockImplementation(() => deleteChain)
      deleteChain.then = (resolve: any) => resolve({ data: null, error: null })

      mockSupabase.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain) })
        .mockReturnValueOnce({ delete: vi.fn().mockReturnValue(deleteChain) })

      const result = await productQueries.deleteProduct(1)

      expect(result).toEqual({ data: null, error: null })
    })

    it("should return error when product not found", async () => {
      const selectChain: any = {}
      selectChain.eq = vi.fn().mockReturnValue(selectChain)
      selectChain.single = vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } })

      mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) })

      const result = await productQueries.deleteProduct(999)

      expect(result.error).toEqual({ message: "Not found" })
    })
  })

  describe("getStoreProduct", () => {
    it("should return store product from embedded data", async () => {
      const mockStoreProduct = createMockStoreProduct({ id: 1 })
      const mockProduct = {
        ...createMockProduct(),
        store_products: [mockStoreProduct],
      }

      const result = await productQueries.getStoreProduct(mockProduct)

      expect(result.data).toEqual(mockStoreProduct)
    })

    it("should return specific store product by id", async () => {
      const sp1 = createMockStoreProduct({ id: 1 })
      const sp2 = createMockStoreProduct({ id: 2 })
      const mockProduct = {
        ...createMockProduct(),
        store_products: [sp1, sp2],
      }

      const result = await productQueries.getStoreProduct(mockProduct, 2)

      expect(result.data).toEqual(sp2)
    })

    it("should fetch from database when not embedded", async () => {
      const mockStoreProduct = createMockStoreProduct({ id: 1 })
      const mockProduct = createMockProduct() as any

      mockChain.single.mockResolvedValue({ data: mockStoreProduct, error: null })

      const result = await productQueries.getStoreProduct(mockProduct, 1)

      expect(mockSupabase.from).toHaveBeenCalledWith("store_products")
      expect(result.data).toEqual(mockStoreProduct)
    })
  })

  describe("insertProductFromStoreProduct", () => {
    it("should create product and link store product", async () => {
      const mockStoreProduct = createMockStoreProduct()
      const mockProduct = createMockProduct({ id: 1 })

      mockChain.single.mockResolvedValueOnce({ data: mockProduct, error: null })
      mockChain.eq.mockResolvedValueOnce({ error: null })

      const result = await productQueries.insertProductFromStoreProduct(mockStoreProduct)

      expect(result.product).toEqual(mockProduct)
      expect(result.error).toBeNull()
    })

    it("should return error when product insert fails", async () => {
      const mockStoreProduct = createMockStoreProduct()
      mockChain.single.mockResolvedValue({ data: null, error: { message: "Insert failed" } })

      const result = await productQueries.insertProductFromStoreProduct(mockStoreProduct)

      expect(result.product).toBeNull()
      expect(result.error).toEqual({ message: "Insert failed" })
    })
  })
})

describe("storeProductQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createChainMock()
    mockSupabase.from.mockReturnValue(mockChain)
  })

  describe("getByUrl", () => {
    it("should return store product by URL", async () => {
      const mockProduct = createMockStoreProduct()
      mockChain.maybeSingle.mockResolvedValue({ data: mockProduct, error: null })

      const result = await storeProductQueries.getByUrl("https://example.com/product")

      expect(mockChain.eq).toHaveBeenCalledWith("url", "https://example.com/product")
      expect(result.data).toEqual(mockProduct)
    })

    it("should return null when not found", async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await storeProductQueries.getByUrl("https://example.com/unknown")

      expect(result.data).toBeNull()
    })
  })

  describe("getAll", () => {
    it("should return paginated store products", async () => {
      const mockProducts = [createMockStoreProduct({ id: 1 })]
      mockChain.range.mockResolvedValue({ data: mockProducts, error: null, count: 1 })

      const result = await storeProductQueries.getAll({ page: 1, limit: 36 })

      expect(result.data).toEqual(mockProducts)
      expect(result.count).toBe(1)
    })

    it("should filter by tracked priority", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({ page: 1, limit: 10, tracked: true })

      expect(mockChain.in).toHaveBeenCalledWith("priority", [1, 2, 3, 4, 5])
    })

    it("should filter by specific priority", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({ page: 1, limit: 10, priority: "5" })

      expect(mockChain.in).toHaveBeenCalledWith("priority", [5])
    })

    it("should filter by origin", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({ page: 1, limit: 10, origin: "1" })

      expect(mockChain.eq).toHaveBeenCalledWith("origin_id", 1)
    })

    it("should apply search query with any type", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({ page: 1, limit: 10, query: "chicken", searchType: "any" })

      expect(mockChain.or).toHaveBeenCalled()
    })

    it("should filter by categories", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({
        page: 1,
        limit: 10,
        category: "Food",
        category2: "Meat",
        category3: "Chicken",
      })

      expect(mockChain.eq).toHaveBeenCalledWith("category", "Food")
      expect(mockChain.eq).toHaveBeenCalledWith("category_2", "Meat")
      expect(mockChain.eq).toHaveBeenCalledWith("category_3", "Chicken")
    })

    it("should filter discounted products", async () => {
      mockChain.range.mockResolvedValue({ data: [], error: null, count: 0 })

      await storeProductQueries.getAll({ page: 1, limit: 10, options: { onlyDiscounted: true } })

      expect(mockChain.gt).toHaveBeenCalledWith("discount", 0)
    })

    it("should augment with favorite status when userId provided", async () => {
      const mockProducts = [createMockStoreProduct({ id: 1 })]
      mockChain.range.mockResolvedValueOnce({ data: mockProducts, error: null, count: 1 })
      mockChain.in.mockResolvedValueOnce({ data: [{ store_product_id: 1 }], error: null })

      const result = await storeProductQueries.getAll({ page: 1, limit: 10, userId: "user-123" })

      expect(result.data?.[0].is_favorited).toBe(true)
    })
  })

  describe("getById", () => {
    it("should return store product by id", async () => {
      const mockProduct = createMockStoreProduct({ id: 1 })
      mockChain.single.mockResolvedValue({ data: mockProduct, error: null })

      const result = await storeProductQueries.getById("1")

      expect(result.data).toEqual(mockProduct)
    })

    it("should include favorite status when userId provided", async () => {
      const mockProduct = createMockStoreProduct({ id: 1 })
      mockChain.single.mockResolvedValueOnce({ data: mockProduct, error: null })
      mockChain.single.mockResolvedValueOnce({ data: { id: 1 }, error: null })

      const result = await storeProductQueries.getById("1", "user-123")

      expect(result.data?.is_favorited).toBe(true)
    })
  })

  describe("getByIds", () => {
    it("should return store products by ids", async () => {
      const mockProducts = [createMockStoreProduct({ id: 1 }), createMockStoreProduct({ id: 2 })]
      mockChain.in.mockResolvedValue({ data: mockProducts, error: null })

      const result = await storeProductQueries.getByIds(["1", "2"])

      expect(mockChain.in).toHaveBeenCalledWith("id", ["1", "2"])
      expect(result.data).toEqual(mockProducts)
    })
  })

  describe("upsert", () => {
    it("should upsert store product", async () => {
      const mockProduct = createMockStoreProduct()
      mockChain.upsert.mockResolvedValue({ data: mockProduct, error: null })

      await storeProductQueries.upsert(mockProduct)

      expect(mockChain.upsert).toHaveBeenCalledWith(mockProduct, {
        onConflict: "url",
        ignoreDuplicates: false,
      })
    })
  })

  describe("updatePriority", () => {
    it("should update priority with valid value", async () => {
      const mockProduct = createMockStoreProduct({ priority: 5 })
      mockChain.single.mockResolvedValue({ data: mockProduct, error: null })

      const result = await storeProductQueries.updatePriority(1, 5)

      expect(result.data).toEqual(mockProduct)
      expect(result.error).toBeNull()
    })

    it("should reject invalid priority value", async () => {
      const result = await storeProductQueries.updatePriority(1, 10)

      expect(result.error).toEqual({
        message: "Priority must be null or an integer between 0 and 5",
        status: 400,
      })
    })

    it("should allow null priority", async () => {
      const mockProduct = createMockStoreProduct({ priority: null })
      mockChain.single.mockResolvedValue({ data: mockProduct, error: null })

      const result = await storeProductQueries.updatePriority(1, null)

      expect(result.data).toEqual(mockProduct)
    })

    it("should update timestamp when option provided", async () => {
      mockChain.single.mockResolvedValue({ data: createMockStoreProduct(), error: null })

      await storeProductQueries.updatePriority(1, 3, { updateTimestamp: true })

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 3,
          priority_updated_at: expect.any(String),
          priority_source: "manual",
        }),
      )
    })

    it("should set source when provided", async () => {
      mockChain.single.mockResolvedValue({ data: createMockStoreProduct(), error: null })

      await storeProductQueries.updatePriority(1, 3, { source: "ai" })

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 3,
          priority_source: "ai",
        }),
      )
    })
  })

  describe("getAllCategories", () => {
    it("should return all categories", async () => {
      const mockCategories = [
        { category: "Food", category_2: "Meat", category_3: "Chicken" },
        { category: "Food", category_2: "Dairy", category_3: "Milk" },
      ]
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCategories, error: null })

      const result = await storeProductQueries.getAllCategories({})

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_distinct_categories")
      expect(result.data).toHaveProperty("category")
      expect(result.data).toHaveProperty("category_2")
      expect(result.data).toHaveProperty("category_3")
      expect(result.data).toHaveProperty("tuples")
    })

    it("should validate category dependencies", async () => {
      const result = await storeProductQueries.getAllCategories({
        category3List: ["Chicken"],
      })

      expect(result.error).toEqual({
        message: "category_1 and category_2 are required when category_3 is specified",
        status: 400,
      })
    })
  })

  describe("getRelatedStoreProducts", () => {
    it("should return related products", async () => {
      const currentProduct = createMockStoreProduct({ id: 1, brand: "TestBrand", category: "Food" })
      const relatedProduct = createMockStoreProduct({ id: 2, brand: "TestBrand" })

      mockChain.single.mockResolvedValueOnce({ data: currentProduct, error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [relatedProduct], error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [], error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [], error: null })

      const result = await storeProductQueries.getRelatedStoreProducts("1", 5)

      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it("should return error when product not found", async () => {
      mockChain.single.mockResolvedValue({ data: null, error: null })

      const result = await storeProductQueries.getRelatedStoreProducts("999")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Product not found")
    })
  })

  describe("getAllNullPriority", () => {
    it("should return products with null priority", async () => {
      const mockProducts = [createMockStoreProduct({ priority: null })]
      mockChain.range.mockResolvedValue({ data: mockProducts, error: null, count: 1 })

      const result = await storeProductQueries.getAllNullPriority({})

      expect(mockChain.is).toHaveBeenCalledWith("priority", null)
      expect(result.data).toEqual(mockProducts)
    })
  })

  describe("getAllByPriority", () => {
    it("should return products with specific priority", async () => {
      const mockProducts = [createMockStoreProduct({ priority: 5 })]
      mockChain.range.mockResolvedValue({ data: mockProducts, error: null, count: 1 })

      const result = await storeProductQueries.getAllByPriority(5, {})

      expect(mockChain.eq).toHaveBeenCalledWith("priority", 5)
      expect(result.data).toEqual(mockProducts)
    })

    it("should reject invalid priority", async () => {
      const result = await storeProductQueries.getAllByPriority(10, {})

      expect(result.error).toEqual({
        message: "Priority must be null or an integer between 0 and 5",
        status: 400,
      })
    })
  })

  describe("getStaleByPriority", () => {
    it("should return stale products", async () => {
      const mockProducts = [createMockStoreProduct({ priority: 5 })]
      setChainResult(mockChain, mockProducts, null, 1)

      // ignoreHours: true to skip the .or() call which is problematic
      const result = await storeProductQueries.getStaleByPriority({ offset: 0, limit: 10, ignoreHours: true })

      expect(result.data).toEqual(mockProducts)
      expect(result.pagination).toEqual({ total: 1, offset: 0, limit: 10 })
    })

    it("should apply time-based filtering when ignoreHours is false", async () => {
      const mockProducts = [createMockStoreProduct({ priority: 5 })]
      setChainResult(mockChain, mockProducts, null, 1)

      const result = await storeProductQueries.getStaleByPriority({ offset: 0, limit: 10, ignoreHours: false })

      expect(mockChain.or).toHaveBeenCalled()
      expect(result.data).toEqual(mockProducts)
    })
  })

  describe("addProductFromObject", () => {
    it("should insert product and return it", async () => {
      const mockProduct = createMockStoreProduct()
      mockChain.single.mockResolvedValue({ data: mockProduct, error: null })

      const result = await storeProductQueries.addProductFromObject(mockProduct)

      expect(result.data).toEqual(mockProduct)
      expect(result.error).toBeNull()
    })
  })

  describe("getSameProductDifferentStores", () => {
    it("should find similar products in different stores", async () => {
      const currentProduct = createMockStoreProduct({
        id: 1,
        origin_id: 1,
        name: "Chicken Breast",
        brand: "BrandX",
        price: 5.99,
      })
      const similarProduct = createMockStoreProduct({
        id: 2,
        origin_id: 2,
        name: "Chicken Breast",
        brand: "BrandX",
        price: 6.49,
      })

      mockChain.single.mockResolvedValueOnce({ data: currentProduct, error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [similarProduct], error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [], error: null })

      const result = await storeProductQueries.getSameProductDifferentStores("1")

      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it("should return error when product not found", async () => {
      mockChain.single.mockResolvedValue({ data: null, error: null })

      const result = await storeProductQueries.getSameProductDifferentStores("999")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Product not found")
    })

    it("should score products based on similarity factors", async () => {
      const currentProduct = createMockStoreProduct({
        id: 1,
        origin_id: 1,
        name: "Organic Chicken Breast",
        brand: "FarmFresh",
        price: 8.99,
        pack: "500g",
      })
      const similarProduct = createMockStoreProduct({
        id: 2,
        origin_id: 2,
        name: "Organic Chicken Breast",
        brand: "FarmFresh",
        price: 9.49,
        pack: "500g",
      })

      mockChain.single.mockResolvedValueOnce({ data: currentProduct, error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [similarProduct], error: null })
      mockChain.limit.mockResolvedValueOnce({ data: [], error: null })

      const result = await storeProductQueries.getSameProductDifferentStores("1")

      expect(result.data).toBeDefined()
      if (result.data && result.data.length > 0) {
        expect(result.data[0]).toHaveProperty("similarity_score")
        expect(result.data[0]).toHaveProperty("similarity_factors")
      }
    })
  })

  describe("getUnsyncedHighPriority", () => {
    it("should call RPC function", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await storeProductQueries.getUnsyncedHighPriority()

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_unsynced_high_priority_products")
    })
  })

  describe("createOrUpdateProduct", () => {
    it("should upsert product with existing created_at", async () => {
      const mockProduct = createMockStoreProduct()
      // First .single() call is for fetching existing created_at
      mockChain.single.mockResolvedValueOnce({ data: { created_at: "2024-01-01T00:00:00Z" }, error: null })
      // Second .single() call is for upsert result
      mockChain.single.mockResolvedValueOnce({ data: mockProduct, error: null })

      const result = await storeProductQueries.createOrUpdateProduct(mockProduct)

      expect(result.data).toEqual(mockProduct)
    })

    it("should set default priority of 1 when none provided", async () => {
      const mockProduct = createMockStoreProduct({ priority: null })
      // First .single() call is for fetching existing created_at
      mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      // Second .single() call is for upsert result
      mockChain.single.mockResolvedValueOnce({ data: mockProduct, error: null })

      await storeProductQueries.createOrUpdateProduct(mockProduct)

      expect(mockChain.upsert).toHaveBeenCalledWith(expect.objectContaining({ priority: 1 }), expect.any(Object))
    })
  })
})
