"use client"

import { useCallback, useMemo, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios, { AxiosError } from "axios"
import type { StoreProduct } from "@/types"
import { useUser } from "@/hooks/useUser"
import { useSetProductPriority } from "@/hooks/useSetProductPriority"

export class ProductUnavailableError extends Error {
  constructor(message: string = "Product is no longer available") {
    super(message)
    this.name = "ProductUnavailableError"
  }
}

function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 1) + "…"
}

async function scrapeAndUpdateStoreProduct(storeProduct: StoreProduct) {
  if (!storeProduct.id) throw new Error("Cannot update a store product without an ID")
  try {
    const response = await axios.post(`/api/products/store`, { storeProduct })
    if (response.status !== 200) throw new Error("Failed to update store product")
    return response.data as StoreProduct
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      throw new ProductUnavailableError()
    }
    throw error
  }
}

async function addFavorite(storeProductId: number) {
  const response = await axios.post("/api/favorites", { store_product_id: storeProductId })
  if (response.status !== 200 && response.status !== 201) throw new Error("Failed to add to favorites")
  return response.data
}

async function removeFavorite(storeProductId: number) {
  const response = await axios.delete("/api/favorites", { data: { store_product_id: storeProductId } })
  if (response.status !== 200) throw new Error("Failed to remove from favorites")
  return response.data
}

/**
 * Hook to manage all store product card mutations with optimistic updates.
 * Centralizes scraping, priority updates, and favorites in one place.
 */
export function useStoreProductCard(sp: StoreProduct) {
  const queryClient = useQueryClient()
  const { user } = useUser()

  const lastSuccessfulFavorite = useRef<boolean | null>(null)
  const { promptAndSetPriority, clearPriority, setPriority, isPending: isPriorityPending } =
    useSetProductPriority(sp.id)

  // Scrape and update mutation
  const updateMutation = useMutation({
    mutationFn: () => scrapeAndUpdateStoreProduct(sp),
    onSuccess: () => {
      toast.success("Product updated from source")
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      if (error instanceof ProductUnavailableError) {
        toast.error("Product unavailable", {
          description: "This product is no longer available at the store",
        })
      } else {
        toast.error("Failed to update product", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      }
      invalidateProductQueries(queryClient, sp.id)
    },
  })

  // Favorite add mutation
  const addFavoriteMutation = useMutation({
    mutationFn: () => addFavorite(sp.id!),
    onSuccess: () => {
      lastSuccessfulFavorite.current = true
      toast.success("Added to favorites", {
        description: sp.name ? truncateName(sp.name, 50) : undefined,
      })
      invalidateFavoriteQueries(queryClient)
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error("Failed to add to favorites", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Favorite remove mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => removeFavorite(sp.id!),
    onSuccess: () => {
      lastSuccessfulFavorite.current = false
      toast.success("Removed from favorites", {
        description: sp.name ? truncateName(sp.name, 50) : undefined,
      })
      invalidateFavoriteQueries(queryClient)
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error("Failed to remove from favorites", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  if (lastSuccessfulFavorite.current !== null && sp.is_favorited === lastSuccessfulFavorite.current) {
    lastSuccessfulFavorite.current = null
  }

  const priority = sp.priority

  const isFavorited = useMemo(() => {
    if (addFavoriteMutation.isPending) return true
    if (removeFavoriteMutation.isPending) return false
    if (lastSuccessfulFavorite.current !== null) return lastSuccessfulFavorite.current
    return sp.is_favorited ?? false
  }, [addFavoriteMutation.isPending, removeFavoriteMutation.isPending, sp.is_favorited])

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to manage favorites")
      return
    }
    if (!sp.id) return

    if (isFavorited) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }, [user, sp.id, isFavorited, addFavoriteMutation, removeFavoriteMutation])

  const updateFromSource = useCallback(() => {
    updateMutation.mutate()
  }, [updateMutation])

  const isProductUnavailable = updateMutation.isError && updateMutation.error instanceof ProductUnavailableError

  return {
    // Effective state (prop + optimistic)
    priority,
    isFavorited,

    // Actions
    updateFromSource,
    toggleFavorite,
    setPriority,
    promptAndSetPriority,
    clearPriority,

    // Loading states
    isUpdating: updateMutation.isPending,
    isPriorityPending,
    isFavoritePending: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,

    // Error states
    hasUpdateError: updateMutation.isError,
    isProductUnavailable,
  }
}

function invalidateProductQueries(queryClient: ReturnType<typeof useQueryClient>, productId?: number) {
  if (productId) {
    queryClient.invalidateQueries({ queryKey: ["storeProduct", productId.toString()] })
  }
  queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
  queryClient.invalidateQueries({ queryKey: ["storeProductsGrid"] })
}

function invalidateFavoriteQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["favorites"] })
  queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
  queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
  queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
}
