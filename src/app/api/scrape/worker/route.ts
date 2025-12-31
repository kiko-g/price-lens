import { NextRequest, NextResponse } from "next/server"
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { createClient } from "@/lib/supabase/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"
import { updatePricePoint } from "@/lib/pricing"
import type { StoreProduct } from "@/types"

export const maxDuration = 30 // 30 seconds per product scrape

interface ScrapeRequest {
  productId: number
  url: string
  name: string
  originId: number
  priority: number
}

/**
 * Worker endpoint - called by QStash for each product to scrape.
 *
 * QStash automatically handles:
 * - Retries (3x with exponential backoff)
 * - Deduplication
 * - Rate limiting (via QStash dashboard)
 */
async function handler(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body: ScrapeRequest = await req.json()
    const { productId, url, name, originId, priority } = body

    if (!url || !originId || !productId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.info(`[Worker] Scraping: ${name} (ID: ${productId})`)

    // Fetch existing product for comparison
    const supabase = createClient()
    const { data: existingProduct } = await supabase.from("store_products").select("*").eq("id", productId).single()

    // Scrape the product
    const response = await scrapeAndReplaceProduct(url, originId, existingProduct as StoreProduct | undefined)
    const json = await response.json()

    if (response.status !== 200) {
      console.warn(`[Worker] Scrape failed for ${name}: ${json.error}`)
      return NextResponse.json({ success: false, error: json.error, productId, url }, { status: response.status })
    }

    // Update price point
    await updatePricePoint({
      ...json.data,
      id: productId,
    })

    const duration = Date.now() - startTime
    console.info(`[Worker] ✓ Scraped: ${name} (${duration}ms)`)

    return NextResponse.json({
      success: true,
      productId,
      name,
      priority,
      duration,
    })
  } catch (error) {
    console.error("[Worker] Error:", error)
    return NextResponse.json(
      { error: "Worker failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

// Wrap with QStash signature verification in production
// This ensures only QStash can call this endpoint
export const POST = process.env.NODE_ENV === "production" ? verifySignatureAppRouter(handler) : handler
