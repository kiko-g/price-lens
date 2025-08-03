"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"

export function useFavoriteToggle() {
  const { user } = useUser()
  const [loadingStates, setLoadingStates] = useState<Set<number>>(new Set())

  const toggleFavorite = useCallback(
    async (storeProductId: number, currentState: boolean) => {
      if (!user) {
        toast.error("Please log in to manage favorites")
        return { success: false, newState: currentState }
      }

      // Add to loading states
      setLoadingStates((prev) => new Set(prev).add(storeProductId))

      try {
        const method = currentState ? "DELETE" : "POST"
        const response = await fetch("/api/favorites", {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_product_id: storeProductId }),
        })

        if (response.ok) {
          const newState = !currentState
          toast.success(newState ? "Added to favorites" : "Removed from favorites")
          return { success: true, newState }
        } else {
          const error = await response.json()
          toast.error(error.error || "Failed to update favorites")
          return { success: false, newState: currentState }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error)
        toast.error("Failed to update favorites")
        return { success: false, newState: currentState }
      } finally {
        // Remove from loading states
        setLoadingStates((prev) => {
          const newSet = new Set(prev)
          newSet.delete(storeProductId)
          return newSet
        })
      }
    },
    [user],
  )

  const isLoading = useCallback(
    (storeProductId: number) => {
      return loadingStates.has(storeProductId)
    },
    [loadingStates],
  )

  return {
    toggleFavorite,
    isLoading,
  }
}
