/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import type { StoreProduct } from "@/types"
import { useStoreProductCard } from "@/hooks/useStoreProductCard"

// ============================================================================
// Mocks
// ============================================================================

const mockAxiosPost = vi.hoisted(() => vi.fn())
const mockAxiosPut = vi.hoisted(() => vi.fn())
const mockAxiosDelete = vi.hoisted(() => vi.fn())

// Create a mock AxiosError class for testing - must be hoisted for vi.mock factory
const MockAxiosError = vi.hoisted(() => {
  return class MockAxiosError extends Error {
    isAxiosError = true
    response?: { status: number; data?: unknown }

    constructor(message: string, status?: number, data?: unknown) {
      super(message)
      this.name = "AxiosError"
      if (status !== undefined) {
        this.response = { status, data }
      }
    }
  }
})

vi.mock("axios", () => ({
  default: {
    post: mockAxiosPost,
    put: mockAxiosPut,
    delete: mockAxiosDelete,
  },
  AxiosError: MockAxiosError,
}))

const mockUser = vi.hoisted(() => ({ id: "user-123", email: "test@test.com" }))
const mockUseUser = vi.hoisted(() =>
  vi.fn(() => ({ user: mockUser as { id: string; email: string } | null, profile: null })),
)

vi.mock("@/hooks/useUser", () => ({
  useUser: mockUseUser,
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ============================================================================
// Test Utilities
// ============================================================================

function createMockStoreProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 1,
    name: "Test Product",
    url: "https://example.com/product/1",
    price: 9.99,
    price_recommended: null,
    is_favorited: false,
    priority: null,
    origin_id: 1,
    brand: "Test Brand",
    category: "Test Category",
    category_2: null,
    category_3: null,
    barcode: null,
    pack: null,
    discount: null,
    image: null,
    price_per_major_unit: null,
    major_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as StoreProduct
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("useStoreProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue({ user: mockUser, profile: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("initial state", () => {
    it("should return initial state from props", () => {
      const sp = createMockStoreProduct({ is_favorited: true, priority: 3 })

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFavorited).toBe(true)
      expect(result.current.priority).toBe(3)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.isFavoritePending).toBe(false)
      expect(result.current.isPriorityPending).toBe(false)
    })

    it("should default isFavorited to false when undefined", () => {
      const sp = createMockStoreProduct({ is_favorited: undefined })

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFavorited).toBe(false)
    })
  })

  describe("toggleFavorite", () => {
    it("should show optimistic true state immediately when adding favorite", async () => {
      const sp = createMockStoreProduct({ is_favorited: false })

      // Make the API call hang so we can observe pending state
      mockAxiosPost.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFavorited).toBe(false)

      act(() => {
        result.current.toggleFavorite()
      })

      // Wait for mutation to start and show optimistic state
      await waitFor(() => {
        expect(result.current.isFavoritePending).toBe(true)
      })
      expect(result.current.isFavorited).toBe(true)
    })

    it("should show optimistic false state immediately when removing favorite", async () => {
      const sp = createMockStoreProduct({ is_favorited: true })

      mockAxiosDelete.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFavorited).toBe(true)

      act(() => {
        result.current.toggleFavorite()
      })

      // Wait for mutation to start and show optimistic state
      await waitFor(() => {
        expect(result.current.isFavoritePending).toBe(true)
      })
      expect(result.current.isFavorited).toBe(false)
    })

    it("should maintain favorited state after successful mutation", async () => {
      const sp = createMockStoreProduct({ is_favorited: false })

      // Use async resolution to ensure React Query has time to set isPending
      mockAxiosPost.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: 200, data: {} }), 10)),
      )

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.toggleFavorite()
      })

      // Wait for mutation to complete and verify optimistic state persists
      await waitFor(() => {
        expect(result.current.isFavoritePending).toBe(false)
        // Should still show true even after mutation completes (ref holds the value)
        expect(result.current.isFavorited).toBe(true)
      })

      expect(toast.success).toHaveBeenCalledWith("Added to favorites", {
        description: "Test Product",
      })
    })

    it("should show error toast when mutation fails", async () => {
      const sp = createMockStoreProduct({ is_favorited: false })

      mockAxiosPost.mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.toggleFavorite()
      })

      await waitFor(() => {
        expect(result.current.isFavoritePending).toBe(false)
      })

      expect(toast.error).toHaveBeenCalledWith("Failed to add to favorites", {
        description: "Network error",
      })
    })

    it("should show error when user is not logged in", async () => {
      mockUseUser.mockReturnValue({ user: null, profile: null })
      const sp = createMockStoreProduct({ is_favorited: false })

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.toggleFavorite()
      })

      expect(toast.error).toHaveBeenCalledWith("Please log in to manage favorites")
      expect(mockAxiosPost).not.toHaveBeenCalled()
    })
  })

  describe("priority mutations", () => {
    it("should trigger priority mutation and show pending state", async () => {
      const sp = createMockStoreProduct({ priority: null })

      mockAxiosPut.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.priority).toBe(null)

      act(() => {
        result.current.setPriority(5)
      })

      await waitFor(() => {
        expect(result.current.isPriorityPending).toBe(true)
      })
      expect(mockAxiosPut).toHaveBeenCalledWith(
        "/api/store_products/1/priority",
        expect.objectContaining({ priority: 5, source: "manual" }),
      )
    })

    it("should maintain priority after successful mutation when prop updates", async () => {
      const sp = createMockStoreProduct({ priority: null })

      mockAxiosPut.mockResolvedValueOnce({ status: 200, data: {} })

      const { result, rerender } = renderHook(({ storeProduct }) => useStoreProductCard(storeProduct), {
        initialProps: { storeProduct: sp },
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.setPriority(3)
      })

      await waitFor(() => {
        expect(result.current.isPriorityPending).toBe(false)
      })

      expect(toast.success).toHaveBeenCalledWith("Priority updated", {
        description: "Product priority set to 3",
      })

      rerender({ storeProduct: createMockStoreProduct({ priority: 3 }) })
      expect(result.current.priority).toBe(3)
    })

    it("should handle clearing priority", async () => {
      const sp = createMockStoreProduct({ priority: 5 })

      mockAxiosPut.mockResolvedValueOnce({ status: 200, data: {} })

      const { result, rerender } = renderHook(({ storeProduct }) => useStoreProductCard(storeProduct), {
        initialProps: { storeProduct: sp },
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.clearPriority()
      })

      await waitFor(() => {
        expect(result.current.isPriorityPending).toBe(false)
      })

      expect(toast.success).toHaveBeenCalledWith("Priority updated", {
        description: "Product priority set to none",
      })

      rerender({ storeProduct: createMockStoreProduct({ priority: null }) })
      expect(result.current.priority).toBe(null)
    })
  })

  describe("updateFromSource", () => {
    it("should call scrape API and show loading state", async () => {
      const sp = createMockStoreProduct()

      mockAxiosPost.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      expect(result.current.isUpdating).toBe(false)

      act(() => {
        result.current.updateFromSource()
      })

      // Wait for mutation to start
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true)
      })
      expect(mockAxiosPost).toHaveBeenCalledWith("/api/store_products/scrape", { storeProduct: sp })
    })

    it("should show success toast after update", async () => {
      const sp = createMockStoreProduct()

      mockAxiosPost.mockResolvedValueOnce({ status: 200, data: sp })

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.updateFromSource()
      })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(toast.success).toHaveBeenCalledWith("Product updated from source")
    })

    it("should set hasUpdateError on failure", async () => {
      const sp = createMockStoreProduct()

      mockAxiosPost.mockRejectedValueOnce(new Error("Scrape failed"))

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.updateFromSource()
      })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(result.current.hasUpdateError).toBe(true)
      expect(result.current.isProductUnavailable).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Failed to update product", {
        description: "Scrape failed",
      })
    })

    it("should set isProductUnavailable when product returns 404", async () => {
      const sp = createMockStoreProduct()

      // Simulate a 404 response from axios using the mock AxiosError
      const error = new MockAxiosError("Request failed with status code 404", 404, {
        error: "Product not found (404)",
        available: false,
      })
      mockAxiosPost.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useStoreProductCard(sp), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.updateFromSource()
      })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(result.current.hasUpdateError).toBe(true)
      expect(result.current.isProductUnavailable).toBe(true)
      expect(toast.error).toHaveBeenCalledWith("Product unavailable", {
        description: "This product is no longer available at the store",
      })
    })
  })

  describe("prop synchronization", () => {
    it("should update when prop catches up to successful mutation", async () => {
      const sp = createMockStoreProduct({ is_favorited: false })

      // Use async resolution to ensure React Query has time to set isPending
      mockAxiosPost.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: 200, data: {} }), 10)),
      )

      const { result, rerender } = renderHook(({ product }) => useStoreProductCard(product), {
        wrapper: createWrapper(),
        initialProps: { product: sp },
      })

      // Toggle favorite
      await act(async () => {
        result.current.toggleFavorite()
      })

      // Wait for mutation to complete and verify state
      await waitFor(() => {
        expect(result.current.isFavoritePending).toBe(false)
        // Should be true from ref
        expect(result.current.isFavorited).toBe(true)
      })

      // Simulate query refetch - prop now matches the successful state
      const updatedSp = createMockStoreProduct({ is_favorited: true })
      rerender({ product: updatedSp })

      // Should still be true, now from prop
      expect(result.current.isFavorited).toBe(true)
    })
  })
})
