import { Price } from "@/types"
import { NextRequest, NextResponse } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const page = parseInt(params.get("page") ?? "1", 10)
  const limit = parseInt(params.get("limit") ?? "50", 10)

  const result = await priceQueries.getPricesPaginated({
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 200),
  })

  return NextResponse.json(result)
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
