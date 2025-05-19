import { Price } from "@/types"
import { NextResponse } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"

export async function GET() {
  const prices = await priceQueries.getPrices()
  return NextResponse.json(prices)
}

export async function PUT(request: Request) {
  try {
    let price = (await request.json()) as Price

    if (!price.store_product_id) {
      return NextResponse.json({ error: "(Supermarket) Product IDs are required" }, { status: 400 })
    }

    await priceQueries.insertNewPricePoint(price)

    return NextResponse.json({
      message: "Price updated successfully",
    })
  } catch (error) {
    console.error("Error updating price:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
