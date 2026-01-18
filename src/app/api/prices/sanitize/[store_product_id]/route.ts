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

    // Delete old prices
    await Promise.all(prices.map((price) => priceQueries.deletePricePoint(price.id)))

    // Insert merged prices
    const insertResults = await Promise.all(mergedPrices.map((price) => priceQueries.insertNewPricePoint(price)))
    const errors = insertResults.filter((r) => r.error).map((r) => r.error)
    if (errors.length > 0) {
      console.error("Errors inserting merged prices:", errors)
    }

    return NextResponse.json({
      deleted: prices,
      merged: mergedPrices,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error in price points route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
