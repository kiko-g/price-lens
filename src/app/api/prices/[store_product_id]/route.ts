import { NextResponse } from "next/server"
import { priceQueries } from "@/lib/queries/prices"

export async function GET(req: Request, { params }: { params: Promise<{ store_product_id: string }> }) {
  try {
    const { store_product_id } = await params
    const storeProductId = parseInt(store_product_id)

    if (isNaN(storeProductId)) {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const url = new URL(req.url)
    const analytics = url.searchParams.get("analytics") === "true"

    if (analytics) {
      const result = await priceQueries.getPricePointsWithAnalytics(storeProductId)
      if (result === null) {
        return NextResponse.json({ error: "Error fetching price points with analytics" }, { status: 500 })
      }
      return NextResponse.json(result)
    } else {
      const prices = await priceQueries.getPricePointsPerIndividualProduct(storeProductId)
      if (prices === null) {
        return NextResponse.json({ error: "Error fetching price points" }, { status: 500 })
      }
      return NextResponse.json(prices)
    }
  } catch (error) {
    console.error("Error in price points route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
