import { NextRequest, NextResponse } from "next/server"
import { searchOffByBrand } from "@/lib/canonical/open-food-facts"

/**
 * GET /api/off/brand?brand=milbona&exclude=4056489726401
 *
 * On-demand proxy to Open Food Facts brand search.
 * Keeps the OFF API call server-side (rate limits, 24h caching).
 */
export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get("brand")
  const exclude = req.nextUrl.searchParams.get("exclude") ?? undefined

  if (!brand) {
    return NextResponse.json({ error: "brand parameter is required" }, { status: 400 })
  }

  const products = await searchOffByBrand(brand, exclude)
  return NextResponse.json(products)
}
