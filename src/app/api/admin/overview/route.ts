import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/overview
 * Returns KPIs and metrics for the admin overview dashboard
 */
export async function GET() {
  try {
    const supabase = createClient()

    // Run all queries in parallel for speed
    const [scrapeStatusCounts, recentlyScraped, pricePointsCount, productsWithBarcode, highPriorityCount] =
      await Promise.all([
        // Scrape status counts
        storeProductQueries.getScrapeStatusCounts(),

        // Recently scraped (last 24h)
        supabase
          .from("store_products")
          .select("id", { count: "exact", head: true })
          .gte("scraped_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Total price points
        supabase.from("prices").select("id", { count: "exact", head: true }),

        // Products with barcode
        supabase.from("store_products").select("id", { count: "exact", head: true }).not("barcode", "is", null),

        // High priority products (P3-P5)
        supabase.from("store_products").select("id", { count: "exact", head: true }).gte("priority", 3),
      ])

    // Get detailed counts per origin (total, available, unavailable)
    const origins = [
      { id: 1, name: "Continente" },
      { id: 2, name: "Auchan" },
      { id: 3, name: "Pingo Doce" },
    ]

    const originDetailedCounts = await Promise.all(
      origins.map(async (origin) => {
        const [total, available, unavailable] = await Promise.all([
          supabase.from("store_products").select("id", { count: "exact", head: true }).eq("origin_id", origin.id),
          supabase
            .from("store_products")
            .select("id", { count: "exact", head: true })
            .eq("origin_id", origin.id)
            .eq("available", true),
          supabase
            .from("store_products")
            .select("id", { count: "exact", head: true })
            .eq("origin_id", origin.id)
            .eq("available", false),
        ])
        return {
          origin_id: origin.id,
          name: origin.name,
          total: total.count ?? 0,
          available: available.count ?? 0,
          unavailable: unavailable.count ?? 0,
        }
      }),
    )

    return NextResponse.json({
      scrapeStatus: scrapeStatusCounts,
      productsByOrigin: originDetailedCounts,
      recentlyScraped24h: recentlyScraped.count ?? 0,
      totalPricePoints: pricePointsCount.count ?? 0,
      productsWithBarcode: productsWithBarcode.count ?? 0,
      highPriorityProducts: highPriorityCount.count ?? 0,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Overview API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
