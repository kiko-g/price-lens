import axios from "axios"
import type { Price, Product, StoreProduct } from "@/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// =============================================================================
// API FUNCTIONS (pure, no React)
// =============================================================================

async function fetchAllPrices() {
  const response = await axios.get("/api/prices")
  if (response.status !== 200) {
    throw new Error("Failed to fetch prices")
  }
  return response.data as Price[]
}

async function fetchShallowProducts() {
  const response = await axios.get("/api/products/shallow")
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data.data as Product[]
}

async function deleteShallowProduct(id: number) {
  const response = await axios.delete("/api/products/shallow/delete", { data: { id } })
  if (response.status !== 200) {
    throw new Error("Failed to delete product")
  }
  return response.data.data as Product
}

async function sanitizePrices(storeProductId: number) {
  const response = await axios.get(`/api/prices/sanitize/${storeProductId}`)
  if (response.status !== 200) {
    throw new Error("Failed to sanitize prices")
  }
  return response.data as { deleted: number; merged: number }
}

async function insertPrice(json: string) {
  const response = await axios.put("/api/prices", json, {
    headers: { "Content-Type": "application/json" },
  })
  if (response.status !== 200) {
    throw new Error("Failed to insert price")
  }
  return response.data
}

async function scrapeProductUrl(url: string) {
  const response = await axios.post("/api/products/store/add", { url })
  if (response.status !== 200) {
    throw new Error(response.data?.error || "Failed to scrape URL")
  }
  return response.data as { product: StoreProduct }
}

async function testScraper(scraperName: string, url: string) {
  const response = await axios.post("/api/admin/scrapers/test", { scraperName, url })
  if (response.status !== 200) {
    throw new Error("Failed to test scraper")
  }
  return response.data
}

type AiPriorityParams = {
  includePriority?: string
  batchSize?: number
}

async function runAiPriorityClassification(params: AiPriorityParams) {
  const searchParams = new URLSearchParams()
  if (params.includePriority) searchParams.set("includePriority", params.includePriority)
  if (params.batchSize) searchParams.set("batchSize", params.batchSize.toString())

  const response = await axios.get(`/api/scrape/ai-priority?${searchParams}`)
  if (response.status !== 200) {
    throw new Error("Failed to run AI classification")
  }
  return response.data
}

// =============================================================================
// QUERY HOOKS (for fetching data)
// =============================================================================

export function useAdminPrices() {
  return useQuery({
    queryKey: ["adminPrices"],
    queryFn: fetchAllPrices,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["adminProducts"],
    queryFn: fetchShallowProducts,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

// =============================================================================
// MUTATION HOOKS (for modifying data)
// =============================================================================

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteShallowProduct,
    onSuccess: () => {
      toast.success("Product deleted")
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] })
    },
    onError: (error) => {
      toast.error("Failed to delete product", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

export function useSanitizePrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sanitizePrices,
    onSuccess: (data) => {
      toast.success("Prices sanitized", {
        description: `Deleted: ${data.deleted}, Merged: ${data.merged}`,
      })
      queryClient.invalidateQueries({ queryKey: ["adminPrices"] })
    },
    onError: (error) => {
      toast.error("Failed to sanitize prices", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

export function useInsertPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: insertPrice,
    onSuccess: () => {
      toast.success("Price inserted")
      queryClient.invalidateQueries({ queryKey: ["adminPrices"] })
    },
    onError: (error) => {
      toast.error("Failed to insert price", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

export function useScrapeProductUrl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: scrapeProductUrl,
    onSuccess: (data) => {
      toast.success("Product scraped", {
        description: `Added product: ${data.product?.name || "Unknown"}`,
      })
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
    },
    onError: (error) => {
      toast.error("Failed to scrape URL", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

export function useTestScraper() {
  return useMutation({
    mutationFn: ({ scraperName, url }: { scraperName: string; url: string }) =>
      testScraper(scraperName, url),
    onError: (error) => {
      toast.error("Failed to test scraper", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

export function useAiPriorityClassification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: runAiPriorityClassification,
    onSuccess: (data) => {
      if (data.results) {
        toast.success("AI classification complete", {
          description: `Success: ${data.results.success}, Failed: ${data.results.failed}`,
        })
      }
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
    },
    onError: (error) => {
      toast.error("AI classification failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })
}

