import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"

import { storeProductQueries } from "@/lib/db/queries/products"
import { updatePricePoint } from "@/lib/pricing"

export const maxDuration = 300 // 5 minutes max duration for Vercel Pro

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    const limit = 42
    const ignoreHours = process.env.NODE_ENV === "development"

    let offset = 0
    let failedScrapes = 0
    let successfulScrapes = 0
    let totalProcessed = 0
    let hasMore = true
    let batchNumber = 0

    const batchStats: Array<{
      batch: number
      processed: number
      successful: number
      failed: number
      duration: number
    }> = []

    while (hasMore) {
      const batchStartTime = Date.now()
      batchNumber++

      const { data, error, pagination } = await storeProductQueries.getStaleByPriority({
        offset,
        limit,
        ignoreHours,
      })

      if (error) {
        console.error("Error fetching products:", error)
        return NextResponse.json({ error: "Error fetching products" }, { status: 500 })
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      console.info(`Processing batch ${batchNumber} (${data.length} products)...`)

      let batchFailed = 0
      let batchSuccessful = 0

      for (const storeProduct of data) {
        const url = storeProduct.url
        const name = storeProduct.name

        try {
          console.info(`Scraping product ${name} (${url})...`)
          const response = await scrapeAndReplaceProduct(url, storeProduct.origin_id, storeProduct)
          const json = await response.json()

          await updatePricePoint({
            ...json.data,
            id: storeProduct.id,
          })

          successfulScrapes++
          batchSuccessful++
        } catch (error) {
          console.warn(`Failed to scrape product ${url}:`, error)
          failedScrapes++
          batchFailed++
        }
      }

      const batchDuration = Date.now() - batchStartTime
      batchStats.push({
        batch: batchNumber,
        processed: data.length,
        successful: batchSuccessful,
        failed: batchFailed,
        duration: batchDuration,
      })

      totalProcessed += data.length

      hasMore = data.length === limit && pagination !== null && pagination.total > offset + limit
      offset += limit
    }

    const totalDuration = Date.now() - startTime
    const avgTimePerProduct = totalProcessed > 0 ? totalDuration / totalProcessed : 0
    const successRate = totalProcessed > 0 ? (successfulScrapes / totalProcessed) * 100 : 0

    if (totalProcessed === 0) {
      console.info("No products found to scrape")
      return NextResponse.json(
        {
          message: "No products found to scrape",
          stats: {
            totalDuration: totalDuration,
            totalProcessed: 0,
            successful: 0,
            failed: 0,
            successRate: 0,
            avgTimePerProduct: 0,
            batches: [],
          },
        },
        { status: 200 },
      )
    }

    const message = `Scraped all products in ${(totalDuration / 1000).toFixed(2)}s (processed ${totalProcessed} products, ${successfulScrapes} successful, ${failedScrapes} failed, ${successRate.toFixed(1)}% success rate).`
    console.info(message)

    return NextResponse.json(
      {
        message,
        stats: {
          totalDuration: totalDuration,
          totalDurationSeconds: (totalDuration / 1000).toFixed(2),
          totalProcessed,
          successful: successfulScrapes,
          failed: failedScrapes,
          successRate: successRate.toFixed(1),
          avgTimePerProduct: avgTimePerProduct.toFixed(0),
          avgTimePerProductSeconds: (avgTimePerProduct / 1000).toFixed(2),
          batches: batchStats,
        },
      },
      { status: 200 },
    )
  } catch (err) {
    const totalDuration = Date.now() - startTime
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json(
      {
        error: "Unexpected server error",
        stats: {
          totalDuration: totalDuration,
          totalDurationSeconds: (totalDuration / 1000).toFixed(2),
          error: err instanceof Error ? err.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}
