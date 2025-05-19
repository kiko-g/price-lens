import type { GetAllQuery } from "@/types/extra"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

async function fetchProducts(params: GetAllQuery) {
  const response = await axios.get("/api/products", { params })
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data
}

async function fetchStoreProduct(id: string) {
  const response = await axios.get(`/api/products/store/${id}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch store product")
  }
  return response.data
}

async function fetchRelatedStoreProducts(id: string, limit: number = 8) {
  const response = await axios.get(`/api/products/store/${id}/related?limit=${limit}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch related store products")
  }
  return response.data
}

export function useProducts(params: GetAllQuery) {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(params),
  })
}

export function useStoreProduct(id: string) {
  return useQuery({
    queryKey: ["storeProduct", id],
    queryFn: () => fetchStoreProduct(id),
  })
}

export function useRelatedStoreProducts(id: string, limit: number = 8) {
  return useQuery({
    queryKey: ["relatedStoreProducts", id, limit],
    queryFn: () => fetchRelatedStoreProducts(id, limit),
  })
}
