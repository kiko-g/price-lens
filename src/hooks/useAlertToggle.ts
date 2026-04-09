"use client"

import { useState, useCallback, useEffect } from "react"
import { useUser } from "@/hooks/useUser"

type ThresholdType = "any_drop" | "percentage" | "target_price"

interface AlertState {
  hasAlert: boolean
  isLoading: boolean
}

export function useAlertToggle(storeProductId: number) {
  const { user } = useUser()
  const [state, setState] = useState<AlertState>({ hasAlert: false, isLoading: true })
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    if (!user || !storeProductId) {
      setState({ hasAlert: false, isLoading: false })
      return
    }

    fetch(`/api/alerts/check?store_product_id=${storeProductId}`)
      .then((res) => res.json())
      .then((data) => setState({ hasAlert: data.has_alert, isLoading: false }))
      .catch(() => setState({ hasAlert: false, isLoading: false }))
  }, [user, storeProductId])

  const toggleAlert = useCallback(
    async (thresholdType: ThresholdType = "any_drop", thresholdValue?: number) => {
      if (!user || isToggling) return

      setIsToggling(true)
      try {
        if (state.hasAlert) {
          await fetch("/api/alerts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store_product_id: storeProductId }),
          })
          setState((prev) => ({ ...prev, hasAlert: false }))
        } else {
          await fetch("/api/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              store_product_id: storeProductId,
              threshold_type: thresholdType,
              threshold_value: thresholdValue,
            }),
          })
          setState((prev) => ({ ...prev, hasAlert: true }))
        }
      } finally {
        setIsToggling(false)
      }
    },
    [user, storeProductId, state.hasAlert, isToggling],
  )

  return {
    hasAlert: state.hasAlert,
    isLoading: state.isLoading,
    isToggling,
    toggleAlert,
  }
}
