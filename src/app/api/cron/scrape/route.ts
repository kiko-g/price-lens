import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { scrapeAndReplaceProduct } from "@/lib/scraper"

export async function GET(req: NextRequest) {
  const BATCH_SIZE = 100

  // if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  const supabase = createClient()

  try {
    const { data: trackerData, error: trackerError } = await supabase
      .from("scrape_jobs")
      .select("*")
      .eq("id", 1)
      .single()

    if (trackerError) {
      throw new Error(`Error reading scrape_jobs: ${trackerError.message}`)
    }

    if (!trackerData) {
      throw new Error("No scrape_jobs row found with id = 1")
    }

    const { next_page, is_done } = trackerData

    if (is_done) {
      return NextResponse.json(
        {
          message: `Scraping is already marked complete at page ${next_page}.`,
        },
        { status: 200 },
      )
    }

    const start = next_page * BATCH_SIZE
    const end = start + BATCH_SIZE - 1
    const { data: products, error: productsError } = await supabase.from("products").select("url").range(start, end)

    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      await supabase.from("scrape_jobs").update({ is_done: true, last_update: new Date().toISOString() }).eq("id", 1)

      return NextResponse.json(
        {
          message: "No more products to scrape. Marked scrape as done.",
        },
        { status: 200 },
      )
    }

    for (const product of products) {
      await scrapeAndReplaceProduct(product.url)
    }

    const batchCount = products.length
    const updatedFields = {
      next_page: next_page + 1,
      is_done: batchCount < BATCH_SIZE,
      last_update: new Date().toISOString(),
    }

    await supabase.from("scrape_jobs").update(updatedFields).eq("id", 1)

    return NextResponse.json(
      {
        message: `Scraped page #${next_page} (processed ${batchCount} products).`,
        next_page: updatedFields.next_page,
        is_done: updatedFields.is_done,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Error scraping batched products in cron job:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
