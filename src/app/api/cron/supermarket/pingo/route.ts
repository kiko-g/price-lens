import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { elapsedMsToTimeStr } from "@/lib/utils"

import { storeProductQueries } from "@/lib/queries/products"

export async function GET(req: NextRequest) {
  try {
    const ORIGIN_STORE = {
      id: 3,
      name: "Pingo Doce",
    }
    const { data, error } = await storeProductQueries.getAllEmptyByOriginId(ORIGIN_STORE.id)

    if (error) {
      console.error(`Error fetching empty products for ${ORIGIN_STORE.name}:`, error)
      return NextResponse.json({ error: `Error fetching empty products for ${ORIGIN_STORE.name}` }, { status: 500 })
    }

    if (!data) {
      console.error(`No ${ORIGIN_STORE.name} products found`)
      return NextResponse.json({ error: `No ${ORIGIN_STORE.name} products found` }, { status: 404 })
    }

    console.info(`🛜 [Cron] Found empty products for ${ORIGIN_STORE.name}: ${data.length}`)
    const start = performance.now()
    const startTime = new Date().toLocaleTimeString("en-US", { hour12: false })
    console.info(`🛜 [Cron] Starting to scrape empty products for ${ORIGIN_STORE.name} at ${startTime}`)

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
          console.info(`🛜 [Cron] [${index + 1}/${data.length}] [${percent.toFixed(1)}%] [${timeStr}] ${url}`)
          await scrapeAndReplaceProduct(url, ORIGIN_STORE.id, product)
        } catch (error) {
          console.warn(`🛜 [Cron] Failed to scrape product ${url}:`, error)
          failedScrapes++
        }
      })

      await Promise.all(promises)
    }

    const message = `🛜 [Cron] Scraped selected products for ${ORIGIN_STORE.name} (processed ${data.length} products, failed ${failedScrapes}).`
    console.info(`🛜 [Cron] ${message}`)

    return NextResponse.json({ message }, { status: 200 })
  } catch (err) {
    console.error(`🛜 [Cron] Unexpected error in scraping batch:`, err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
