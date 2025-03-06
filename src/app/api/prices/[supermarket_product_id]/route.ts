import { NextResponse, NextRequest } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"

export async function GET(req: NextRequest, { params }: { params: { supermarket_product_id: string } }) {
  try {
    const supermarketProductId = parseInt(params.supermarket_product_id)

    if (isNaN(supermarketProductId)) {
      return NextResponse.json({ error: "Invalid supermarket_product_id" }, { status: 400 })
    }

    const prices = await priceQueries.getPricePointsPerIndividualProduct(supermarketProductId)
    if (prices === null) {
      return NextResponse.json({ error: "Error fetching price points" }, { status: 500 })
    }

    return NextResponse.json(prices)
  } catch (error) {
    console.error("Error in price points route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
