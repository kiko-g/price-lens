import axios from "axios"
import type { GetAllQuery } from "@/types/extra"
import type { ProductLinked, StoreProduct } from "@/types"
import { useQuery } from "@tanstack/react-query"

async function fetchProducts(params?: { type?: "essential" | "non-essential" }) {
  const response = await axios.get("/api/products", { params })
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data as ProductLinked[]
}

async function fetchStoreProducts(params: GetAllQuery) {
  const response = await axios.get("/api/products/store", { params })
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data as StoreProduct[]
}

async function fetchStoreProduct(id: string) {
  const response = await axios.get(`/api/products/store/${id}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch store product")
  }
  return response.data as StoreProduct
}

async function fetchRelatedStoreProducts(id: string, limit: number = 8) {
  const response = await axios.get(`/api/products/store/${id}/related?limit=${limit}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch related store products")
  }
  return response.data as StoreProduct[]
}

export function useProducts(params?: { type?: "essential" | "non-essential" }) {
  return useQuery({
    queryKey: ["products", params?.type],
    queryFn: () => fetchProducts(params),
  })
}

export function useStoreProducts(params: GetAllQuery) {
  return useQuery({
    queryKey: ["storeProducts", params],
    queryFn: () => fetchStoreProducts(params),
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
