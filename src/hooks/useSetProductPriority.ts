"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useUpdateStoreProductPriority } from "@/hooks/useProducts"

export function useSetProductPriority(storeProductId: number | undefined) {
  const mutation = useUpdateStoreProductPriority()

  const promptAndSetPriority = useCallback(() => {
    if (!storeProductId) {
      toast.error("Invalid product", { description: "Product ID is missing" })
      return
    }

    const priorityStr = window.prompt("Enter priority (0-5):", "5")
    if (priorityStr === null) return

    const priorityNum = parseInt(priorityStr)
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 5) {
      toast.error("Invalid priority", {
        description: "Priority must be a number between 0 and 5",
      })
      return
    }

    mutation.mutate({ storeProductId, priority: priorityNum, source: "manual" })
  }, [storeProductId, mutation])

  const clearPriority = useCallback(() => {
    if (!storeProductId) {
      toast.error("Invalid product", { description: "Product ID is missing" })
      return
    }
    mutation.mutate({ storeProductId, priority: null, source: "manual" })
  }, [storeProductId, mutation])

  const setPriority = useCallback(
    (priority: number | null) => {
      if (!storeProductId) {
        toast.error("Invalid product", { description: "Product ID is missing" })
        return
      }
      mutation.mutate({ storeProductId, priority, source: "manual" })
    },
    [storeProductId, mutation],
  )

  return {
    promptAndSetPriority,
    clearPriority,
    setPriority,
    isPending: mutation.isPending,
  }
}
