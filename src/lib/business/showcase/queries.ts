import "server-only"

import { createClient } from "@/lib/supabase/server"
import { buildChartData } from "@/lib/business/chart"
import type { Price } from "@/types"
import { SHOWCASE_PRODUCT_IDS } from "./index"
import type { ShowcaseData, ShowcaseTrendStats } from "./index"

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
    return { percent: 0, direction: "stable", period: "1M" }
  }

  // Sort by date ascending
  const sortedPrices = [...recentPrices].sort(
    (a, b) => new Date(a.valid_from || "").getTime() - new Date(b.valid_from || "").getTime(),
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
 * Fetch showcase products with pre-computed chart data and trend statistics.
 * Server-only: designed for Server Components.
 */
export async function getShowcaseProducts(productIds: string[]): Promise<ShowcaseData> {
  try {
    // Ensure we have a proper array
    if (!productIds || !Array.isArray(productIds)) {
      productIds = SHOWCASE_PRODUCT_IDS
    }

    const supabase = createClient()

    // Batch fetch all products
    const { data: products, error: productsError } = await supabase
      .from("store_products")
      .select("*")
      .in("id", productIds)

    if (productsError) {
      console.error("Error fetching showcase products:", productsError)
      return {}
    }

    // Batch fetch all prices for these products
    const { data: allPrices, error: pricesError } = await supabase
      .from("prices")
      .select("*")
      .in("store_product_id", productIds)
      .order("valid_from", { ascending: true })

    if (pricesError) {
      console.error("Error fetching showcase prices:", pricesError)
      return {}
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

    // Build the result with pre-computed data
    const result: ShowcaseData = {}

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

    return result
  } catch (error) {
    console.error("Error in getShowcaseProducts:", error)
    return {}
  }
}
