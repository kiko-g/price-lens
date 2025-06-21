import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"

import { productQueries } from "@/lib/db/queries/products"
import { updatePricePoint } from "@/lib/pricing"

export async function GET(req: NextRequest) {
  try {
    let offset = 0
    const limit = 24
    let failedScrapes = 0
    let totalProcessed = 0
    let hasMore = true

    while (hasMore) {
      const { data, error, pagination } = await productQueries.getAllLinked({
        offset,
        limit,
      })

      if (error) {
        console.error("Error fetching products:", error)
        return NextResponse.json({ error: "Error fetching products" }, { status: 500 })
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      console.info(`Processing batch ${Math.floor(offset / limit) + 1} (${data.length} products)...`)

      for (const product of data) {
        for (const storeProduct of product.store_products) {
          const url = storeProduct.url
          try {
            console.info(`Scraping product ${url}...`)
            const response = await scrapeAndReplaceProduct(url, storeProduct.origin_id, storeProduct)
            const json = await response.json()

            await updatePricePoint(product, {
              ...json.data,
              id: storeProduct.id,
            })
          } catch (error) {
            console.warn(`Failed to scrape product ${url}:`, error)
            failedScrapes++
          }
        }
      }

      totalProcessed += data.flatMap((p) => p.store_products).length

      hasMore = data.length === limit && pagination !== null && pagination.total > offset + limit
      offset += limit
    }

    if (totalProcessed === 0) {
      console.info("No products found to scrape")
      return NextResponse.json({ message: "No products found to scrape" }, { status: 200 })
    }

    const message = `Scraped all products (processed ${totalProcessed} products, failed ${failedScrapes}).`
    console.info(message)

    return NextResponse.json({ message }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
