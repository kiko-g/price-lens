"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"
import { TriangleIcon, BanIcon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

async function addFavorite(storeProductId: number) {
  const response = await axios.post("/api/favorites", { store_product_id: storeProductId })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.error || "Failed to add to favorites")
  }
  return response.data
}

async function removeFavorite(storeProductId: number) {
  const response = await axios.delete("/api/favorites", {
    data: { store_product_id: storeProductId },
  })
  if (response.status !== 200) {
    throw new Error(response.data?.error || "Failed to remove from favorites")
  }
  return response.data
}

export function useFavoriteToggle() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Added to favorites
          <TriangleIcon className="size-3 fill-green-500 stroke-green-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error(
        <div className="flex items-center gap-2">
          {error instanceof Error ? error.message : "Failed to update favorites"}
          <BanIcon className="size-3 rotate-180 stroke-red-500" />
        </div>,
      )
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Removed from favorites
          <TriangleIcon className="size-3 rotate-180 fill-red-500 stroke-red-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error(
        <div className="flex items-center gap-2">
          {error instanceof Error ? error.message : "Failed to update favorites"}
          <BanIcon className="size-3 rotate-180 stroke-red-500" />
        </div>,
      )
    },
  })

  const toggleFavorite = useCallback(
    async (storeProductId: number, currentState: boolean) => {
      if (!user) {
        toast.error(
          <div className="flex items-center gap-2">
            Please log in to manage favorites
            <BanIcon className="size-3 stroke-red-500" />
          </div>,
        )
        return { success: false, newState: currentState }
      }

      try {
        if (currentState) {
          await removeMutation.mutateAsync(storeProductId)
        } else {
          await addMutation.mutateAsync(storeProductId)
        }
        return { success: true, newState: !currentState }
      } catch {
        return { success: false, newState: currentState }
      }
    },
    [user, addMutation, removeMutation],
  )

  const isLoading = useCallback(
    (storeProductId: number) => {
      return (
        (addMutation.isPending && addMutation.variables === storeProductId) ||
        (removeMutation.isPending && removeMutation.variables === storeProductId)
      )
    },
    [addMutation, removeMutation],
  )

  return {
    toggleFavorite,
    isLoading,
  }
}
