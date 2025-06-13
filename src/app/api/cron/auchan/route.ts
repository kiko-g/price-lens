import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"
import { elapsedMsToTimeStr } from "@/lib/utils"

import { storeProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await storeProductQueries.getAllEmptyByOriginId(2)

    if (error) {
      console.error("Error fetching empty products:", error)
      return NextResponse.json({ error: "Error fetching empty products" }, { status: 500 })
    }

    if (!data) {
      console.error("No auchan products found")
      return NextResponse.json({ error: "No auchan products found" }, { status: 404 })
    }

    console.info(`Found empty products for Auchan: ${data.length}`)
    const start = performance.now()
    const startTime = new Date().toLocaleTimeString("en-US", { hour12: false })
    console.info(`Starting to scrape empty products for Auchan at ${startTime}`)

    let failedScrapes = 0
    const batchSize = 5

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      const promises = batch.map(async (product, batchIndex) => {
        const url = product.url
        const index = i + batchIndex
        try {
          const percent = ((index + 1) / data.length) * 100
          const elapsedMs = performance.now() - start
          const timeStr = elapsedMsToTimeStr(elapsedMs)
          console.info(`[${index + 1}/${data.length}] [${percent.toFixed(1)}%] [${timeStr}] ${url}`)
          await scrapeAndReplaceProduct(url, product, "auchan")
        } catch (error) {
          console.warn(`Failed to scrape product ${url}:`, error)
          failedScrapes++
        }
      })

      await Promise.all(promises)
    }

    const message = `Scraped selected products (processed ${data.length} products, failed ${failedScrapes}).`
    console.info(message)

    return NextResponse.json({ message }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
