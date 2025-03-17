import { NextRequest, NextResponse } from "next/server"

import { scrapeAndReplaceProduct } from "@/lib/scraper"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supermarketProduct = body.supermarketProduct

    if (!supermarketProduct || !supermarketProduct.url) {
      return NextResponse.json({ error: "Bad request", details: "Missing supermarketProduct or url" }, { status: 400 })
    }

    return await scrapeAndReplaceProduct(supermarketProduct.url, supermarketProduct)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
