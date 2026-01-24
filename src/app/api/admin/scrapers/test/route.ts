import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scrapeAndReplaceProduct, StoreOrigin } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/business/pricing"
import type { StoreProduct } from "@/types"

const SCRAPER_NAME_TO_ORIGIN: Record<string, number> = {
  continente: StoreOrigin.Continente,
  auchan: StoreOrigin.Auchan,
  "pingo doce": StoreOrigin.PingoDoce,
  pingodoce: StoreOrigin.PingoDoce,
}

/**
 * Test scraper endpoint - scrapes a single URL and updates the price point
 * Used by the admin test page to verify scrapers are working
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { scraperName, url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Determine origin from scraper name or URL
    let originId: number | null = null

    if (scraperName) {
      originId = SCRAPER_NAME_TO_ORIGIN[scraperName.toLowerCase()] ?? null
    }

    // Fallback: detect from URL
    if (!originId) {
      if (url.includes("continente.pt")) {
        originId = StoreOrigin.Continente
      } else if (url.includes("auchan.pt")) {
        originId = StoreOrigin.Auchan
      } else if (url.includes("pingodoce.pt")) {
        originId = StoreOrigin.PingoDoce
      }
    }

    if (!originId) {
      return NextResponse.json({ error: "Could not determine store origin from URL" }, { status: 400 })
    }

    // Get existing product if any
    const supabase = createClient()
    const { data: existingProduct } = await supabase.from("store_products").select("*").eq("url", url).maybeSingle()

    console.info(`🛜 [Test Scraper] Scraping: ${url}`)

    // Scrape the product
    const response = await scrapeAndReplaceProduct(url, originId, existingProduct as StoreProduct | undefined)
    const json = await response.json()

    if (response.status !== 200) {
      return NextResponse.json(
        {
          success: false,
          error: json.error,
          url,
          duration: Date.now() - startTime,
        },
        { status: response.status },
      )
    }

    // Get the updated product ID (either existing or newly created)
    const { data: updatedProduct } = await supabase.from("store_products").select("id").eq("url", url).single()

    if (!updatedProduct?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product was scraped but could not find it in database",
          scrapedData: json.data,
        },
        { status: 500 },
      )
    }

    // Update price point - THIS IS THE CRITICAL PART
    console.info(`🛜 [Test Scraper] Updating price point for product ${updatedProduct.id}`)
    await updatePricePoint({
      ...json.data,
      id: updatedProduct.id,
    })

    const duration = Date.now() - startTime
    console.info(`🛜 [Test Scraper] ✓ Complete: ${url} (${duration}ms)`)

    // Fetch the latest price point to show in response
    const { data: latestPrice } = await supabase
      .from("prices")
      .select("*")
      .eq("store_product_id", updatedProduct.id)
      .order("valid_from", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      productId: updatedProduct.id,
      scrapedData: json.data,
      latestPricePoint: latestPrice,
      duration,
    })
  } catch (error) {
    console.error("[Test Scraper] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 },
    )
  }
}
