import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/overview
 * Returns KPIs and metrics for the admin overview dashboard.
 * Uses a single RPC call for all stats (store_products + prices count).
 */
export async function GET() {
  try {
    const supabase = createClient()

    const start = performance.now()
    const statsResult = await supabase.rpc("get_admin_overview_stats")
    const elapsed = Math.round(performance.now() - start)
    console.log(`[admin/overview] RPC get_admin_overview_stats: ${elapsed}ms`)

    if (statsResult.error) {
      throw new Error(`RPC error: ${statsResult.error.message}`)
    }

    const stats = statsResult.data

    return NextResponse.json({
      scrapeStatus: {
        neverScraped: stats.never_scraped,
        unavailable: stats.unavailable,
        available: stats.available,
        total: stats.total,
      },
      productsByOrigin: [
        {
          origin_id: 1,
          name: "Continente",
          total: stats.continente_total,
          available: stats.continente_available,
          unavailable: stats.continente_unavailable,
        },
        {
          origin_id: 2,
          name: "Auchan",
          total: stats.auchan_total,
          available: stats.auchan_available,
          unavailable: stats.auchan_unavailable,
        },
        {
          origin_id: 3,
          name: "Pingo Doce",
          total: stats.pingo_doce_total,
          available: stats.pingo_doce_available,
          unavailable: stats.pingo_doce_unavailable,
        },
      ],
      recentlyScraped24h: stats.recently_scraped_24h,
      totalPricePoints: stats.total_price_points,
      productsWithBarcode: stats.with_barcode,
      highPriorityProducts: stats.high_priority,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Overview API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
