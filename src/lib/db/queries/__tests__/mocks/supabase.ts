import { vi } from "vitest"

// Chain-able query builder mock
export const createQueryBuilderMock = () => {
  const mock: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    // Result properties
    data: null as any,
    error: null as any,
    count: null as number | null,
  }

  // Make it thenable to support await
  mock.then = (resolve: any) => resolve({ data: mock.data, error: mock.error, count: mock.count })

  return mock
}

// Mock result setter
export const setMockResult = (
  mock: ReturnType<typeof createQueryBuilderMock>,
  data: any,
  error: any = null,
  count: number | null = null,
) => {
  mock.data = data
  mock.error = error
  mock.count = count
  mock.then = (resolve: any) => resolve({ data, error, count })
  return mock
}

// Create full Supabase client mock
export const createSupabaseMock = () => {
  const queryBuilder = createQueryBuilderMock()

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    queryBuilder,
  }
}

// Mock createClient functions
export const mockCreateClient = vi.fn()
export const mockCreateClientBrowser = vi.fn()

// Setup mocks for both server and client
export const setupSupabaseMocks = () => {
  const serverMock = createSupabaseMock()
  const browserMock = createSupabaseMock()

  mockCreateClient.mockReturnValue(serverMock)
  mockCreateClientBrowser.mockReturnValue(browserMock)

  return { serverMock, browserMock }
}

// Test data factories
export const createMockStoreProduct = (overrides = {}) => ({
  id: 1,
  origin_id: 1,
  url: "https://example.com/product/1",
  name: "Test Product",
  brand: "Test Brand",
  barcode: null as string | null,
  pack: "1kg",
  price: 9.99,
  price_recommended: 12.99,
  price_per_major_unit: 9.99,
  major_unit: "kg",
  discount: 23,
  image: "https://example.com/image.jpg",
  category: "Food",
  category_2: "Meat",
  category_3: "Chicken",
  priority: 3,
  priority_updated_at: "2024-01-01T00:00:00Z",
  priority_source: "ai" as const,
  product_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
})

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: "Test Product",
  brand: "Test Brand",
  category: "Food",
  is_generic: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
})

export const createMockPrice = (overrides = {}) => ({
  id: 1,
  store_product_id: 1,
  price: 9.99,
  price_recommended: 12.99,
  price_per_major_unit: 9.99,
  discount: 23,
  valid_from: "2024-01-01T00:00:00Z",
  valid_to: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  ...overrides,
})

export const createMockFavorite = (overrides = {}) => ({
  id: 1,
  user_id: "user-123",
  store_product_id: 1,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
})
