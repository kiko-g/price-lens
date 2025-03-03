import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"
import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await productQueries.getAllAttached()

    if (error) {
      console.error("Error fetching uncharted products:", error)
      return NextResponse.json({ error: "Error fetching uncharted products" }, { status: 500 })
    }

    if (!data) {
      console.error("No uncharted products found")
      return NextResponse.json({ error: "No uncharted products found" }, { status: 404 })
    }

    const supermarketProducts = data?.flatMap((product) => product.supermarket_products)
    const urls = supermarketProducts?.map((product) => product.url)

    if (!urls) {
      console.error("No urls found")
      return NextResponse.json({ error: "No urls found" }, { status: 404 })
    }

    console.info(`Scraping ${urls.length} products...`)

    let failedScrapes = 0
    for (const url of urls) {
      try {
        console.info(`Scraping product ${url}...`)
        const product = await scrapeAndReplaceProduct(url)
        console.info(`Scraped product ${url} successfully`)
      } catch (error) {
        console.warn(`Failed to scrape product ${url}:`, error)
        failedScrapes++
      }
    }

    console.info(`Completed scraping. Processed: ${urls.length}, Failed: ${failedScrapes}`)

    return NextResponse.json(
      {
        message: `Scraped selected products (processed ${urls.length} products, failed ${failedScrapes}).`,
        is_done: true,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
