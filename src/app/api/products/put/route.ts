import { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { continenteProductPageScraper } from "@/lib/scraper"
import { createOrUpdateProduct } from "@/lib/supabase/actions"

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const product = await continenteProductPageScraper(url)

    if (!product || Object.keys(product).length === 0) {
      return NextResponse.json({ error: "Product scraping failed", url }, { status: 404 })
    }

    if (!isValidProduct(product)) {
      return NextResponse.json({ error: "Invalid product data structure", url }, { status: 422 })
    }

    const { data, error } = await createOrUpdateProduct(product)

    if (error) {
      return NextResponse.json({ error: "Database operation failed", details: error }, { status: 500 })
    }

    return NextResponse.json({ product, data, message: "Product upserted" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

function isValidProduct(product: any): product is Product {
  return typeof product === "object" && product !== null && typeof product.url === "string"
}
