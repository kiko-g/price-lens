import axios from "axios"
import type { Price, PricesWithAnalytics } from "@/types"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"

export async function fetchPrices(storeProductId: string) {
  const response = await axios.get(`/api/prices/${storeProductId}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch prices")
  }
  return response.data as Price[]
}

export async function fetchPricesWithAnalytics(storeProductId: string) {
  const response = await axios.get(`/api/prices/${storeProductId}?analytics=true`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch prices with analytics")
  }
  return response.data as PricesWithAnalytics
}

export function usePrices(storeProductId: string) {
  return useQuery({
    queryKey: ["prices", storeProductId],
    queryFn: () => fetchPrices(storeProductId),
  })
}

export function usePricesWithAnalytics(
  storeProductId: string,
  options?: Omit<UseQueryOptions<PricesWithAnalytics>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["prices", storeProductId, "analytics"],
    queryFn: () => fetchPricesWithAnalytics(storeProductId),
    ...options,
  })
}
