import { crawlContinenteCategoryPages } from "@/lib/scraper"

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    await crawlContinenteCategoryPages()
    return NextResponse.json({ message: "Crawling started" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
