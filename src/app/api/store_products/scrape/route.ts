import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/business/pricing"
import { invalidateSingleProductCache } from "@/lib/kv"

/**
 * POST /api/store_products/scrape
 *
 * Scrapes and updates an existing store product from its source URL.
 * Also updates the price point after scraping.
 *
 * Request Body:
 * - storeProduct: { id, url, origin_id, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const storeProduct = body.storeProduct

    if (!storeProduct || !storeProduct.url) {
      return NextResponse.json({ error: "Bad request", details: "Missing storeProduct or url" }, { status: 400 })
    }

    // Scrape and update the product
    const response = await scrapeAndReplaceProduct(storeProduct.url, storeProduct.origin_id, storeProduct)
    const json = await response.json()

    // If scrape failed, return the error response
    if (response.status !== 200) {
      return NextResponse.json(json, { status: response.status })
    }

    // Update price point if we have a product ID
    const productId = storeProduct.id

    if (productId && json.data) {
      // Update price point - same as automated scrapers do
      await updatePricePoint({
        ...json.data,
        id: productId,
      })

      // Invalidate cache for this product
      await invalidateSingleProductCache(productId.toString())
    }

    return NextResponse.json(json, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
