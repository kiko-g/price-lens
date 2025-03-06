import { priceQueries } from "@/lib/db/queries/prices"
import { NextResponse } from "next/server"

export async function GET() {
  await priceQueries.deleteAllPricePoints()
  return NextResponse.json({ message: "All price points deleted" })
}
