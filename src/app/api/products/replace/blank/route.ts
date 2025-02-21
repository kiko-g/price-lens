import { NextRequest, NextResponse } from "next/server"

import { scrapeAndReplaceProduct } from "@/lib/scraper"
import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await productQueries.getUncharted()

    if (error) {
      console.error("Error fetching uncharted products:", error)
      return NextResponse.json({ error: "Error fetching uncharted products" }, { status: 500 })
    }

    if (!data) {
      console.error("No uncharted products found")
      return NextResponse.json({ error: "No uncharted products found" }, { status: 404 })
    }

    const urls = data?.map((product) => product.url)

    if (!urls) {
      console.error("No urls found")
      return NextResponse.json({ error: "No urls found" }, { status: 404 })
    }

    for (const [index, url] of urls.entries()) {
      console.debug(`${index + 1}/${urls.length}`, url)
      await scrapeAndReplaceProduct(url)
    }

    return NextResponse.json({ urls, error })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
