"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"
import { TriangleIcon, BanIcon } from "lucide-react"

export function useFavoriteToggle() {
  const { user } = useUser()
  const [loadingStates, setLoadingStates] = useState<Set<number>>(new Set())

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
          toast.success(
            newState ? (
              <div className="flex items-center gap-2">
                Added to favorites
                <TriangleIcon className="size-3 fill-green-500 stroke-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Removed from favorites
                <TriangleIcon className="size-3 rotate-180 fill-red-500 stroke-red-500" />
              </div>
            ),
          )
          return { success: true, newState }
        } else {
          const error = await response.json()
          toast.error(
            <div className="flex items-center gap-2">
              {error.error || "Failed to update favorites"}
              <BanIcon className="size-3 rotate-180 stroke-red-500" />
            </div>,
          )
          return { success: false, newState: currentState }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error)
        toast.error(
          <div className="flex items-center gap-2">
            Failed to update favorites
            <BanIcon className="size-3 rotate-180 stroke-red-500" />
          </div>,
        )
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
