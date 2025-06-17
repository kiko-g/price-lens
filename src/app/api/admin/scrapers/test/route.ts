import { Scrapers } from "@/lib/scraper"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scraperName, url } = body

    if (!scraperName || !url) {
      return NextResponse.json({ error: "scraperName and url are required" }, { status: 400 })
    }

    let scraperAction
    if (scraperName === "Continente") {
      scraperAction = Scrapers.continente.productPage
    } else if (scraperName === "Auchan") {
      scraperAction = Scrapers.auchan.productPage
    } else {
      return NextResponse.json({ error: "Invalid scraperName" }, { status: 400 })
    }

    const result = await scraperAction(url)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in test scraper route:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to test scraper: ${errorMessage}` }, { status: 500 })
  }
}
