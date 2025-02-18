import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { fetchHtml } from "@/lib/scraper"

export async function GET(req: NextRequest) {
  const supabase = createClient()

  try {
    const { data: products, error: productsError } = await supabase.from("products").select("url")

    if (!products) {
      return NextResponse.json({ error: "No products found" }, { status: 404 })
    }

    if (productsError) {
      return NextResponse.json({ error: "Error fetching products" }, { status: 500 })
    }

    for (let i = 0; i < products.length; i++) {
      const url = products[i].url
      const html = await fetchHtml(url)

      if (html) console.info(`Got the html for product ${url}`)
      else console.warn(`Failed to get the html for product ${url}`)
    }
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
