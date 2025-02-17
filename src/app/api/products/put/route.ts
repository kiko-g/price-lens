import { NextRequest, NextResponse } from "next/server"

import { scrapeAndReplaceProduct } from "@/lib/scraper"

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url")
    await scrapeAndReplaceProduct(url)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
