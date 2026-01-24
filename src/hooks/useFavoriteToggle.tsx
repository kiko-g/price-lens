"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

interface MutationVariables {
  storeProductId: number
  productName?: string
}

function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 1) + "…"
}

async function addFavorite({ storeProductId }: MutationVariables) {
  const response = await axios.post("/api/favorites", { store_product_id: storeProductId })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.error || "Failed to add to favorites")
  }
  return response.data
}

async function removeFavorite({ storeProductId }: MutationVariables) {
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
    onSuccess: (_, variables) => {
      toast.success("Added to favorites", {
        description: variables.productName ? truncateName(variables.productName, 50) : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error("Failed to add to favorites", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: (_, variables) => {
      toast.success("Removed from favorites", {
        description: variables.productName ? truncateName(variables.productName, 50) : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error("Failed to remove from favorites", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  const toggleFavorite = useCallback(
    async (storeProductId: number, currentState: boolean, productName?: string) => {
      if (!user) {
        toast.error("Please log in to manage favorites")
        return { success: false, newState: currentState }
      }

      try {
        if (currentState) {
          await removeMutation.mutateAsync({ storeProductId, productName })
        } else {
          await addMutation.mutateAsync({ storeProductId, productName })
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
        (addMutation.isPending && addMutation.variables?.storeProductId === storeProductId) ||
        (removeMutation.isPending && removeMutation.variables?.storeProductId === storeProductId)
      )
    },
    [addMutation, removeMutation],
  )

  return {
    toggleFavorite,
    isLoading,
  }
}
