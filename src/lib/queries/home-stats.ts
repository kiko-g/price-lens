import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AnalyticsSnapshotData } from "@/types/analytics"

export type PerStoreStats = {
  originId: number
  name: string
  total: number
  available: number
  onDiscount: number
}

export type HomeStats = {
  totalProducts: number
  priceDropsToday: number
  productsOnDiscount: number
  totalSavingsEuros24h: number
  totalDiscountSavingsEuros: number
  freshWithin24h: number
  perStore: PerStoreStats[]
  computedAt: string | null
}

const FALLBACK: HomeStats = {
  totalProducts: 0,
  priceDropsToday: 0,
  productsOnDiscount: 0,
  totalSavingsEuros24h: 0,
  totalDiscountSavingsEuros: 0,
  freshWithin24h: 0,
  perStore: [],
  computedAt: null,
}

export async function getHomeStats(): Promise<HomeStats> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("analytics_snapshots")
      .select("data, computed_at")
      .order("computed_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error("Failed to fetch home stats:", error)
      return FALLBACK
    }

    const snapshot = data.data as unknown as AnalyticsSnapshotData

    const perStore: PerStoreStats[] = (snapshot.per_store ?? []).map((s) => ({
      originId: s.origin_id,
      name: s.name,
      total: s.total,
      available: s.available,
      onDiscount: s.on_discount ?? 0,
    }))

    return {
      totalProducts: snapshot.scrape_status?.total ?? 0,
      priceDropsToday: snapshot.price_intelligence?.decreases_24h ?? 0,
      productsOnDiscount: snapshot.price_intelligence?.products_with_discount ?? 0,
      totalSavingsEuros24h: snapshot.price_intelligence?.total_savings_euros_24h ?? 0,
      totalDiscountSavingsEuros: snapshot.price_intelligence?.total_discount_savings_euros ?? 0,
      freshWithin24h: snapshot.scrape_freshness?.within_24h ?? 0,
      perStore,
      computedAt: data.computed_at ?? null,
    }
  } catch (error) {
    console.error("Error in getHomeStats:", error)
    return FALLBACK
  }
}
