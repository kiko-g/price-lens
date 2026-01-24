import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildChartData } from "@/lib/utils"
import type { Price, StoreProduct, ProductChartEntry } from "@/types"

export type ShowcaseTrendStats = {
  percent: number
  direction: "up" | "down" | "stable"
  period: string
}

export type ShowcaseProduct = {
  storeProduct: StoreProduct
  prices: Price[]
  chartData: ProductChartEntry[]
  trendStats: ShowcaseTrendStats
}

export type ShowcaseResponse = {
  products: Record<string, ShowcaseProduct>
}

/**
 * Calculate trend statistics for the last 30 days
 * This matches what the chart actually displays
 */
function calculateTrendStats(prices: Price[]): ShowcaseTrendStats {
  if (!prices || prices.length < 2) {
    return { percent: 0, direction: "stable", period: "1M" }
  }

  // Get prices from the last 30 days only
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentPrices = prices.filter((p) => {
    if (!p.valid_from) return false
    const validFrom = new Date(p.valid_from)
    return validFrom >= thirtyDaysAgo
  })

  if (recentPrices.length < 2) {
    // Not enough data in last 30 days, use all available but mark as stable
    return { percent: 0, direction: "stable", period: "1M" }
  }

  // Sort by date ascending
  const sortedPrices = [...recentPrices].sort(
    (a, b) => new Date(a.valid_from || "").getTime() - new Date(b.valid_from || "").getTime()
  )

  const firstPrice = sortedPrices[0].price || 0
  const lastPrice = sortedPrices[sortedPrices.length - 1].price || 0

  if (firstPrice === 0) {
    return { percent: 0, direction: "stable", period: "1M" }
  }

  const priceChange = lastPrice - firstPrice
  const percentChange = (priceChange / firstPrice) * 100

  let direction: "up" | "down" | "stable" = "stable"
  if (percentChange > 0.5) direction = "up"
  else if (percentChange < -0.5) direction = "down"

  return {
    percent: Math.abs(percentChange),
    direction,
    period: "1M",
  }
}

/**
 * GET /api/products/showcase?ids=123,456,789
 * 
 * Batch fetch products with their prices, pre-computed chart data, and trend statistics.
 * Optimized for the home page carousel - single request instead of 14 separate calls.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json({ error: "Missing 'ids' parameter" }, { status: 400 })
    }

    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 })
    }

    if (ids.length > 20) {
      return NextResponse.json({ error: "Maximum 20 products allowed" }, { status: 400 })
    }

    const supabase = createClient()

    // Batch fetch all products
    const { data: products, error: productsError } = await supabase
      .from("store_products")
      .select("*")
      .in("id", ids)

    if (productsError) {
      console.error("Error fetching showcase products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Batch fetch all prices for these products
    const { data: allPrices, error: pricesError } = await supabase
      .from("prices")
      .select("*")
      .in("store_product_id", ids)
      .order("valid_from", { ascending: true })

    if (pricesError) {
      console.error("Error fetching showcase prices:", pricesError)
      return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
    }

    // Group prices by product ID
    const pricesByProductId = new Map<string, Price[]>()
    for (const price of allPrices || []) {
      const productId = String(price.store_product_id)
      if (!pricesByProductId.has(productId)) {
        pricesByProductId.set(productId, [])
      }
      pricesByProductId.get(productId)!.push(price)
    }

    // Build the response with pre-computed data
    const result: Record<string, ShowcaseProduct> = {}

    for (const product of products || []) {
      const productId = String(product.id)
      const prices = pricesByProductId.get(productId) || []
      
      // Pre-compute chart data using efficient sampling
      const chartData = buildChartData(prices, { range: "1M", samplingMode: "efficient" })
      
      // Calculate trend stats for the displayed period
      const trendStats = calculateTrendStats(prices)

      result[productId] = {
        storeProduct: product,
        prices,
        chartData,
        trendStats,
      }
    }

    return NextResponse.json({ products: result } satisfies ShowcaseResponse)
  } catch (error) {
    console.error("Error in showcase route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
