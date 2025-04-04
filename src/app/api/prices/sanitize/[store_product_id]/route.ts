import { NextResponse } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"
import { mergeAndSanitize } from "@/lib/pricing"

export async function GET(_req: Request, { params }: { params: Promise<{ store_product_id: string }> }) {
  try {
    const { store_product_id } = await params
    const storeProductId = parseInt(store_product_id)

    if (isNaN(storeProductId)) {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const prices = await priceQueries.getPricePointsPerIndividualProduct(storeProductId)
    if (prices === null) {
      return NextResponse.json({ error: "Error fetching price points" }, { status: 500 })
    }

    if (prices.length <= 1) {
      return NextResponse.json({ error: "Not enough price points to sanitize." }, { status: 200 })
    }

    const mergedPrices = mergeAndSanitize(prices)
    prices.forEach((price) => priceQueries.deletePricePoint(price.id))
    mergedPrices.forEach((price) => priceQueries.insertNewPricePoint(price))

    return NextResponse.json({
      deleted: prices,
      merged: mergedPrices,
    })
  } catch (error) {
    console.error("Error in price points route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
