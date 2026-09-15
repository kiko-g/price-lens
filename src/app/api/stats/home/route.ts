import { NextResponse } from "next/server"

import { getHomeStats } from "@/lib/queries/home-stats"

export const dynamic = "force-dynamic"

export type LivePulse = {
  totalProducts: number
  priceDropsToday: number
  productsOnDiscount: number
  computedAt: string | null
}

/** GET /api/stats/home — compact live pulse for the app shell (sidebar "AO VIVO" card). */
export async function GET() {
  try {
    const stats = await getHomeStats()
    const pulse: LivePulse = {
      totalProducts: stats.totalProducts,
      priceDropsToday: stats.priceDropsToday,
      productsOnDiscount: stats.productsOnDiscount,
      computedAt: stats.computedAt,
    }
    return NextResponse.json(pulse, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=900" },
    })
  } catch (error) {
    console.error("[api/stats/home] GET error:", error)
    return NextResponse.json({ error: "Failed to load live pulse" }, { status: 500 })
  }
}
