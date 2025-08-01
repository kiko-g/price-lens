import axios from "axios"
import type { GetAllQuery } from "@/types/extra"
import type { ProductWithListings, StoreProduct } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

type GetProductsParams = {
  offset?: number
  limit?: number
  q?: string
}

async function getProducts(params?: GetProductsParams) {
  const response = await axios.get("/api/products", { params })
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data as ProductWithListings[]
}

async function getStoreProducts(params: GetAllQuery) {
  const response = await axios.get("/api/products/store", { params })
  if (response.status !== 200) {
    throw new Error("Failed to fetch products")
  }
  return response.data as StoreProduct[]
}

async function getStoreProduct(id: string) {
  const response = await axios.get(`/api/products/store/${id}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch store product")
  }
  return response.data as StoreProduct
}

async function getRelatedStoreProducts(id: string, limit: number = 8) {
  const response = await axios.get(`/api/products/store/${id}/related?limit=${limit}`)
  if (response.status !== 200) {
    throw new Error("Failed to fetch related store products")
  }
  return response.data as StoreProduct[]
}

async function scrapeAndUpdateStoreProduct(storeProduct: StoreProduct) {
  const id = storeProduct.id
  if (!id) throw new Error("Cannot update a store product without an ID")

  const response = await axios.post(`/api/products/store/${id}`, { storeProduct })
  if (response.status !== 200) {
    throw new Error("Failed to update store product")
  }
  return response.data as StoreProduct
}

async function getStoreProductCategories() {
  const response = await axios.get("/api/categories")
  if (response.status !== 200) {
    throw new Error("Failed to fetch store product categories")
  }
  return response.data.data as {
    category: string[]
    category_2: string[]
    category_3: string[]
    tuples: { category: string; category_2: string; category_3: string }[]
  }
}

// hooks
export function useProducts({ offset = 0, limit = 36, q = "" }: GetProductsParams) {
  return useQuery({
    queryKey: ["products", offset, limit, q],
    queryFn: () => getProducts({ offset, limit, q }),
    enabled: !q || q.length > 2,
  })
}

export function useStoreProducts(params: GetAllQuery) {
  return useQuery({
    queryKey: ["storeProducts", params],
    queryFn: () => getStoreProducts(params),
  })
}

export function useStoreProduct(id: string) {
  return useQuery({
    queryKey: ["storeProduct", id],
    queryFn: () => getStoreProduct(id),
  })
}

export function useRelatedStoreProducts(id: string, limit: number = 8) {
  return useQuery({
    queryKey: ["relatedStoreProducts", id, limit],
    queryFn: () => getRelatedStoreProducts(id, limit),
  })
}

export function useUpdateStoreProduct() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: scrapeAndUpdateStoreProduct,
    onSuccess: (data) => {
      const id = data.id?.toString()
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["storeProduct", id] })
      }
      router.refresh()
    },
    onError: () => {
      // Consider adding a user-facing error message here
    },
  })
}

export function useStoreProductCategories() {
  return useQuery({
    queryKey: ["storeProductCategories"],
    queryFn: () => getStoreProductCategories(),
  })
}
