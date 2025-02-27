import { NextRequest, NextResponse } from "next/server"

import { scrapeAndReplaceProduct } from "@/lib/scraper"
import { supermarketProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supermarketProductQueries.getInvalid()

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

    const BATCH_SIZE = 5
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE)
      const now = new Date()
      const timeTakenSoFar = `${Math.floor((now.getTime() - start.getTime()) / 60000)}m ${Math.floor(((now.getTime() - start.getTime()) % 60000) / 1000)}s`
      console.debug(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)}`,
        now.toISOString(),
        `(${timeTakenSoFar} so far)`,
      )

      await Promise.all(
        batch.map((url, batchIndex) => {
          console.debug(`[${i + batchIndex + 1}/${urls.length}] Processing ${url}`)
          return scrapeAndReplaceProduct(url)
        }),
      )
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
