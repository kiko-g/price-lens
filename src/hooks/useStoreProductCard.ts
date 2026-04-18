"use client"

import { useCallback, useMemo, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import axios, { AxiosError } from "axios"
import type { StoreProduct } from "@/types"
import { mergeStoreProductScrapeResponse } from "@/lib/store-product-scrape-response"
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
    const response = await axios.post(`/api/store_products/scrape`, { storeProduct })
    if (response.status !== 200) throw new Error("Failed to update store product")
    return mergeStoreProductScrapeResponse(storeProduct, response.data)
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
  const tFav = useTranslations("toasts.favorites")
  const tUpd = useTranslations("toasts.productUpdate")

  const lastSuccessfulFavorite = useRef<boolean | null>(null)
  const {
    promptAndSetPriority,
    clearPriority,
    setPriority,
    isPending: isPriorityPending,
  } = useSetProductPriority(sp.id)

  // Scrape and update mutation
  const updateMutation = useMutation({
    mutationFn: () => scrapeAndUpdateStoreProduct(sp),
    onSuccess: () => {
      toast.success(tUpd("success"))
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      if (error instanceof ProductUnavailableError) {
        toast.error(tUpd("unavailableTitle"), {
          description: tUpd("unavailableBody"),
        })
      } else {
        toast.error(tUpd("failed"), {
          description: error instanceof Error ? error.message : tFav("unknownError"),
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
      toast.success(tFav("added"), {
        description: sp.name ? truncateName(sp.name, 50) : undefined,
      })
      invalidateFavoriteQueries(queryClient)
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error(tFav("addFailed"), {
        description: error instanceof Error ? error.message : tFav("unknownError"),
      })
    },
  })

  // Favorite remove mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => removeFavorite(sp.id!),
    onSuccess: () => {
      lastSuccessfulFavorite.current = false
      toast.success(tFav("removed"), {
        description: sp.name ? truncateName(sp.name, 50) : undefined,
      })
      invalidateFavoriteQueries(queryClient)
      invalidateProductQueries(queryClient, sp.id)
    },
    onError: (error) => {
      toast.error(tFav("removeFailed"), {
        description: error instanceof Error ? error.message : tFav("unknownError"),
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
      toast.error(tFav("loginToManage"))
      return
    }
    if (!sp.id) return

    if (isFavorited) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }, [user, sp.id, isFavorited, addFavoriteMutation, removeFavoriteMutation, tFav])

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
