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

    const start = new Date()
    console.debug("Starting to process", urls.length, "urls", start.toISOString())

    for (const [index, url] of urls.entries()) {
      const now = new Date()
      const timeTakenSoFar = `${Math.floor((now.getTime() - start.getTime()) / 60000)}m ${Math.floor(((now.getTime() - start.getTime()) % 60000) / 1000)}s`
      console.debug(`[${index + 1}/${urls.length}]`, now.toISOString(), `(${timeTakenSoFar} so far)`, url)
      await scrapeAndReplaceProduct(url)
    }

    const end = new Date()
    console.debug("Done", end.toISOString())
    console.debug(
      "Time taken:",
      `${Math.floor((end.getTime() - start.getTime()) / 60000)}m ${Math.floor(((end.getTime() - start.getTime()) % 60000) / 1000)}s`,
    )

    return NextResponse.json({ message: `Processed ${urls.length} blank urls` }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
