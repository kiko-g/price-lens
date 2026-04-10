"use client"

import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"

export interface FavoriteSummaryItem {
  id: number
  name: string
  brand: string | null
  image: string | null
  price: number
  origin_id: number
  discount: number | null
  price_recommended: number | null
  price_per_major_unit: number | null
  major_unit: string | null
  pack: string | null
}

interface FavoritesResponse {
  data: Array<{ store_products: FavoriteSummaryItem }>
  pagination?: { totalCount: number }
}

async function fetchFavoritesSummary(limit: number): Promise<{
  items: FavoriteSummaryItem[]
  totalCount: number | null
}> {
  const res = await fetch(`/api/favorites?limit=${limit}`)
  if (!res.ok) return { items: [], totalCount: null }
  const data: FavoritesResponse = await res.json()
  const items = data.data?.map((f) => f.store_products).filter(Boolean) || []
  const totalCount = data.pagination?.totalCount ?? data.data?.length ?? null
  return { items, totalCount }
}

export function useUserFavoritesSummary(limit = 18) {
  const { user } = useUser()

  return useQuery({
    queryKey: ["user-favorites-summary", limit],
    queryFn: () => fetchFavoritesSummary(limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
