import axios from "axios"
import type { GetAllQuery } from "@/types/extra"
import type { ProductWithListings, StoreProduct } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePrices } from "./usePrices"

type GetProductsParams = {
  offset?: number
  limit?: number
  q?: string
  origin?: number
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
  return response.data.data as StoreProduct[]
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

  console.debug("Updating product:", storeProduct)

  const response = await axios.post(`/api/products/store`, { storeProduct })
  if (response.status !== 200) throw new Error("Failed to update store product")
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
export function useProducts({ offset = 0, limit = 36, q = "", origin = 0 }: GetProductsParams) {
  return useQuery({
    queryKey: ["products", offset, limit, q, origin],
    queryFn: () => getProducts({ offset, limit, q, origin }),
    enabled: !q || q.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useStoreProducts(params: GetAllQuery) {
  return useQuery({
    queryKey: [
      "storeProducts",
      params.page,
      params.limit,
      params.tracked,
      params.query,
      params.sort,
      params.searchType,
      params.nonNulls,
      params.categories,
      params.category,
      params.category2,
      params.category3,
      params.originId,
      params.userId,
      params.options?.onlyDiscounted,
    ],
    queryFn: () => getStoreProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useStoreProductById(id: string) {
  return useQuery({
    queryKey: ["storeProduct", id],
    queryFn: () => getStoreProduct(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useStoreProductWithPricesById(id: string) {
  const storeProductQuery = useStoreProductById(id)
  const pricesQuery = usePrices(id)

  return {
    data:
      storeProductQuery.data && pricesQuery.data
        ? {
            storeProduct: storeProductQuery.data,
            prices: pricesQuery.data,
          }
        : undefined,
    isLoading: storeProductQuery.isLoading || pricesQuery.isLoading,
    error: storeProductQuery.error || pricesQuery.error,
    isError: storeProductQuery.isError || pricesQuery.isError,
  }
}

export function useRelatedStoreProducts(id: string, limit: number = 8) {
  return useQuery({
    queryKey: ["relatedStoreProducts", id, limit],
    queryFn: () => getRelatedStoreProducts(id, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useUpdateStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: scrapeAndUpdateStoreProduct,
    onSuccess: (data) => {
      const id = data.id?.toString()
      console.debug(data)
      toast.success("Product updated", {
        description: `Product ${id} has been updated successfully.`,
      })
      if (id) queryClient.invalidateQueries({ queryKey: ["storeProduct", id] })
    },
    onError: (error) => {
      toast.error("Failed to update product", {
        description: error.message,
      })
    },
  })
}

export function useStoreProductCategories() {
  return useQuery({
    queryKey: ["storeProductCategories"],
    queryFn: () => getStoreProductCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
