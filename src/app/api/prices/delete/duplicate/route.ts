import { priceQueries } from "@/lib/db/queries/prices"
import { NextResponse } from "next/server"

export async function GET() {
  await priceQueries.deleteDuplicatePricePoints()
  return NextResponse.json({ message: "Duplicate price points deleted" })
}
