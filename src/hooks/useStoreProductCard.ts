"use client"

import { useCallback, useMemo, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios, { AxiosError } from "axios"
import type { StoreProduct } from "@/types"
import { useUser } from "@/hooks/useUser"

export class ProductUnavailableError extends Error {
  constructor(message: string = "Product is no longer available") {
    super(message)
    this.name = "ProductUnavailableError"
  }
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

async function updateStoreProductPriority(storeProductId: number, priority: number | null) {
  const response = await axios.put(`/api/products/store/${storeProductId}/priority`, { priority })
  if (response.status !== 200) throw new Error(response.data?.error || "Failed to update priority")
  return response.data
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

  // Track last successful state to prevent flicker between mutation complete and query refetch
  const lastSuccessfulFavorite = useRef<boolean | null>(null)
  const lastSuccessfulPriority = useRef<number | null | undefined>(undefined)

  // Scrape and update mutation
  const updateMutation = useMutation({
    mutationFn: () => scrapeAndUpdateStoreProduct(sp),
    onSuccess: (data) => {
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

  // Priority mutation with optimistic update
  const priorityMutation = useMutation({
    mutationFn: (priority: number | null) => updateStoreProductPriority(sp.id!, priority),
    onSuccess: (_, priority) => {
      lastSuccessfulPriority.current = priority
      toast.success("Priority updated", {
        description: `Priority set to ${priority === null ? "none" : priority}`,
      })
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error("Failed to update priority", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Favorite add mutation
  const addFavoriteMutation = useMutation({
    mutationFn: () => addFavorite(sp.id!),
    onSuccess: () => {
      lastSuccessfulFavorite.current = true
      toast.success("Added to favorites")
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
      toast.success("Removed from favorites")
      invalidateFavoriteQueries(queryClient)
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error("Failed to remove from favorites", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Reset refs when prop catches up (query refetched with new data)
  if (lastSuccessfulFavorite.current !== null && sp.is_favorited === lastSuccessfulFavorite.current) {
    lastSuccessfulFavorite.current = null
  }
  if (lastSuccessfulPriority.current !== undefined && sp.priority === lastSuccessfulPriority.current) {
    lastSuccessfulPriority.current = undefined
  }

  // Compute effective values with optimistic updates
  // Priority order: pending mutation > last successful > prop
  const priority = useMemo(() => {
    if (priorityMutation.isPending && priorityMutation.variables !== undefined) {
      return priorityMutation.variables
    }
    if (lastSuccessfulPriority.current !== undefined) {
      return lastSuccessfulPriority.current
    }
    return sp.priority
  }, [priorityMutation.isPending, priorityMutation.variables, sp.priority])

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

  const setPriority = useCallback(
    (newPriority: number | null) => {
      if (!sp.id) {
        toast.error("Invalid product", { description: "Product ID is missing" })
        return
      }
      priorityMutation.mutate(newPriority)
    },
    [sp.id, priorityMutation],
  )

  const promptAndSetPriority = useCallback(() => {
    if (!sp.id) {
      toast.error("Invalid product", { description: "Product ID is missing" })
      return
    }

    const priorityStr = window.prompt("Enter priority (0-5):", "5")
    const priorityNum = priorityStr ? parseInt(priorityStr) : null
    if (priorityNum === null || isNaN(priorityNum) || priorityNum < 0 || priorityNum > 5) {
      toast.error("Invalid priority", { description: "Priority must be a number between 0 and 5" })
      return
    }

    priorityMutation.mutate(priorityNum)
  }, [sp.id, priorityMutation])

  const clearPriority = useCallback(() => {
    if (!sp.id) {
      toast.error("Invalid product", { description: "Product ID is missing" })
      return
    }
    priorityMutation.mutate(null)
  }, [sp.id, priorityMutation])

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
    isPriorityPending: priorityMutation.isPending,
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
