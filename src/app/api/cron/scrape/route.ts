import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"

export async function GET(req: NextRequest) {
  const BATCH_SIZE = 100
  const CONCURRENT_REQUESTS = 5

  const supabase = createClient()

  try {
    const { data: trackerData, error: trackerError } = await supabase
      .from("scrape_jobs")
      .select("*")
      .eq("id", 1)
      .single()

    if (trackerError) {
      console.error(`Error reading scrape_jobs: ${trackerError.message}`)
      return NextResponse.json({ error: "Failed to fetch scrape job" }, { status: 500 })
    }

    if (!trackerData) {
      console.error("No scrape_jobs row found with id = 1")
      return NextResponse.json({ error: "Scrape job missing" }, { status: 500 })
    }

    const { next_page, is_done } = trackerData

    if (is_done) {
      return NextResponse.json(
        { message: `Scraping is already marked complete at page ${next_page}.` },
        { status: 200 },
      )
    }

    const start = next_page * BATCH_SIZE
    const end = start + BATCH_SIZE - 1
    const { data: products, error: productsError } = await supabase.from("products").select("url").range(start, end)

    if (productsError) {
      console.error(`Error fetching products: ${productsError.message}`)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      await supabase.from("scrape_jobs").update({ is_done: true, last_update: new Date().toISOString() }).eq("id", 1)
      return NextResponse.json({ message: "No more products to scrape. Marked scrape as done." }, { status: 200 })
    }

    console.info(`Scraping ${products.length} products...`)

    let failedScrapes = 0
    for (let i = 0; i < products.length; i += CONCURRENT_REQUESTS) {
      const batch = products.slice(i, i + CONCURRENT_REQUESTS)
      const results = await Promise.allSettled(
        batch.map(async (product) => {
          try {
            return await scrapeAndReplaceProduct(product.url)
          } catch (error) {
            console.warn(`Failed to scrape product ${product.url}:`, error)
            failedScrapes++
            return null
          }
        }),
      )

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(`Scrape failed for ${batch[index].url}:`, result.reason)
          failedScrapes++
        }
      })
    }

    console.info(`Completed batch #${next_page}. Processed: ${products.length}, Failed: ${failedScrapes}`)

    const updatedFields = {
      next_page: next_page + 1,
      is_done: products.length < BATCH_SIZE,
      last_update: new Date().toISOString(),
    }

    await supabase.from("scrape_jobs").update(updatedFields).eq("id", 1)

    return NextResponse.json(
      {
        message: `Scraped page #${next_page} (processed ${products.length} products, failed ${failedScrapes}).`,
        next_page: updatedFields.next_page,
        is_done: updatedFields.is_done,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Unexpected error in scraping batch:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
