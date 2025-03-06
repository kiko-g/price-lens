import { NextResponse } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"

export async function GET(_req: Request, { params }: { params: Promise<{ supermarket_product_id: string }> }) {
  try {
    const { supermarket_product_id } = await params
    const supermarketProductId = parseInt(supermarket_product_id)

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
