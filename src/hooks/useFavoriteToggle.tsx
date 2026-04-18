"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("toasts.favorites")

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: (_, variables) => {
      toast.success(t("added"), {
        description: variables.productName ? truncateName(variables.productName, 50) : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error(t("addFailed"), {
        description: error instanceof Error ? error.message : t("unknownError"),
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: (_, variables) => {
      toast.success(t("removed"), {
        description: variables.productName ? truncateName(variables.productName, 50) : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
    },
    onError: (error) => {
      toast.error(t("removeFailed"), {
        description: error instanceof Error ? error.message : t("unknownError"),
      })
    },
  })

  const toggleFavorite = useCallback(
    async (storeProductId: number, currentState: boolean, productName?: string) => {
      if (!user) {
        toast.error(t("loginToManage"))
        return { success: false, newState: currentState }
      }

      try {
        if (currentState) {
          await removeMutation.mutateAsync({ storeProductId, productName })
        } else {
          await addMutation.mutateAsync({ storeProductId, productName })
        }
        return { success: true, newState: !currentState }
      } catch (err) {
        console.error("[useFavoriteToggle] toggle failed:", err)
        return { success: false, newState: currentState }
      }
    },
    [user, addMutation, removeMutation, t],
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
