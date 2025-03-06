import { NextResponse } from "next/server"
import { priceQueries } from "@/lib/db/queries/prices"

export async function GET() {
  const prices = await priceQueries.getPrices()
  return NextResponse.json(prices)
}
