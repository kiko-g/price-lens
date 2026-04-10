"use client"

import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"

export interface AlertWithProduct {
  id: number
  store_product_id: number
  threshold_type: string
  threshold_value: number | null
  is_active: boolean
  created_at: string
  store_products: {
    id: number
    name: string
    brand: string | null
    image: string | null
    price: number
    origin_id: number
    available: boolean | null
  }
}

async function fetchAlerts(): Promise<AlertWithProduct[]> {
  const res = await fetch("/api/alerts")
  if (!res.ok) return []
  const data = await res.json()
  return data.alerts || []
}

export function useUserAlerts() {
  const { user } = useUser()

  return useQuery({
    queryKey: ["user-alerts"],
    queryFn: fetchAlerts,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
