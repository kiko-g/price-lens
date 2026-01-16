import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/pricing"
import type { StoreProduct } from "@/types"

// 5 minutes max for batch processing
// With ~40 products and ~5 sec each = ~200 seconds, leaving buffer
export const maxDuration = 300

interface BatchProduct {
  id: number
  url: string
  name: string
  originId: number
  priority: number
}

interface BatchRequest {
  batchId: string
  products: BatchProduct[]
}

interface ProductResult {
  id: number
  success: boolean
  duration: number
  error?: string
}

/**
 * BATCH WORKER
 *
 * Processes multiple products in a single request.
 * Called by QStash with a batch of products to scrape.
 *
 * Benefits:
 * - Reduces QStash message count (1 message per batch, not per product)
 * - More efficient use of serverless function time
 * - Lower costs (stays in free tier)
 */
async function handler(req: NextRequest) {
  console.log("[BatchWorker] === REQUEST RECEIVED ===")
  const batchStartTime = Date.now()

  // Debug: Log headers
  const contentType = req.headers.get("content-type")
  const upstashSignature = req.headers.get("upstash-signature")
  console.log(`[BatchWorker] Content-Type: ${contentType}, Has Upstash Signature: ${!!upstashSignature}`)

  try {
    // Debug: Log raw body first
    const rawBody = await req.text()
    console.log(`[BatchWorker] Raw body length: ${rawBody.length}`)
    console.log(`[BatchWorker] Raw body preview: ${rawBody.substring(0, 500)}`)

    // Parse the body - handle potential double-encoding from QStash
    let body: BatchRequest
    try {
      let parsed = JSON.parse(rawBody)
      // If QStash double-encoded, parsed will be a string, not an object
      if (typeof parsed === "string") {
        console.log("[BatchWorker] Detected double-encoded JSON, parsing again")
        parsed = JSON.parse(parsed)
      }
      body = parsed
    } catch (parseError) {
      console.error("[BatchWorker] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON body", rawPreview: rawBody.substring(0, 200) }, { status: 400 })
    }

    console.log(`[BatchWorker] Batch ID: ${body.batchId}, Products: ${body.products?.length || 0}`)
    const { batchId, products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products in batch" }, { status: 400 })
    }

    console.info(`[BatchWorker] Starting batch ${batchId} with ${products.length} products`)

    const supabase = createClient()
    const results: ProductResult[] = []
    let successCount = 0
    let failCount = 0

    // Process each product sequentially
    // (Parallel would be faster but risks rate limiting from stores)
    for (const product of products) {
      const productStartTime = Date.now()

      try {
        // Fetch existing product for comparison
        const { data: existingProduct } = await supabase
          .from("store_products")
          .select("*")
          .eq("id", product.id)
          .single()

        // Scrape the product
        const response = await scrapeAndReplaceProduct(
          product.url,
          product.originId,
          existingProduct as StoreProduct | undefined,
        )
        const json = await response.json()

        if (response.status !== 200) {
          failCount++
          results.push({
            id: product.id,
            success: false,
            duration: Date.now() - productStartTime,
            error: json.error || "Scrape failed",
          })
          console.warn(`[BatchWorker] ✗ Failed: ${product.name} - ${json.error}`)
          continue
        }

        // Update price point
        await updatePricePoint({
          ...json.data,
          id: product.id,
        })

        successCount++
        results.push({
          id: product.id,
          success: true,
          duration: Date.now() - productStartTime,
        })

        console.info(`[BatchWorker] ✓ Scraped: ${product.name} (${Date.now() - productStartTime}ms)`)
      } catch (error) {
        failCount++
        results.push({
          id: product.id,
          success: false,
          duration: Date.now() - productStartTime,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        console.error(`[BatchWorker] ✗ Error for ${product.name}:`, error)
      }

      // Small delay between products to avoid hammering stores
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const totalDuration = Date.now() - batchStartTime
    const avgDuration = Math.round(totalDuration / products.length)

    console.info(
      `[BatchWorker] Completed batch ${batchId}: ${successCount}/${products.length} success in ${totalDuration}ms (avg ${avgDuration}ms/product)`,
    )

    return NextResponse.json({
      batchId,
      total: products.length,
      success: successCount,
      failed: failCount,
      duration: totalDuration,
      avgDuration,
      results,
    })
  } catch (error) {
    console.error("[BatchWorker] Batch error:", error)
    return NextResponse.json(
      { error: "Batch worker failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

// Wrap with QStash signature verification in production
// TODO: Re-enable once we confirm QStash is working
// export const POST = process.env.NODE_ENV === "production" ? verifySignatureAppRouter(handler) : handler
export const POST = handler // Temporarily disabled for debugging
