import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"

import { productQueries } from "@/lib/db/queries/products"
import { updatePricePoint } from "@/lib/pricing"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await productQueries.getAllLinked()

    if (error) {
      console.error("Error fetching uncharted products:", error)
      return NextResponse.json({ error: "Error fetching uncharted products" }, { status: 500 })
    }

    if (!data) {
      console.error("No uncharted products found")
      return NextResponse.json({ error: "No uncharted products found" }, { status: 404 })
    }

    let failedScrapes = 0
    for (const product of data) {
      for (const storeProduct of product.store_products) {
        const url = storeProduct.url
        try {
          console.info(`Scraping product ${url}...`)
          const response = await scrapeAndReplaceProduct(url, storeProduct)
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

    const message = `Scraped selected products (processed ${data.flatMap((p) => p.store_products).length} products, failed ${failedScrapes}).`
    console.info(message)

    return NextResponse.json({ message }, { status: 200 })
  } catch (err) {
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
