import axios from "axios"
import type { Price } from "@/types"
import { useQuery } from "@tanstack/react-query"

export async function fetchPrices(storeProductId: string) {
  const response = await axios.get(`/api/prices/${storeProductId}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch prices")
  }
  return response.data as Price[]
}

export function usePrices(storeProductId: string) {
  return useQuery({
    queryKey: ["prices", storeProductId],
    queryFn: () => fetchPrices(storeProductId),
  })
}
