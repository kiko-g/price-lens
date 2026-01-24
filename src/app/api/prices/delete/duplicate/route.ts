import { priceQueries } from "@/lib/queries/prices"
import { NextResponse } from "next/server"

// GET: Return stats about duplicate price points (without deleting)
export async function GET() {
  const stats = await priceQueries.getDuplicatePricePointsStats()

  if (!stats) {
    return NextResponse.json({ error: "Failed to get duplicate stats" }, { status: 500 })
  }

  return NextResponse.json({
    totalPricePoints: stats.totalPricePoints,
    duplicateCount: stats.duplicateCount,
    affectedProductsCount: stats.affectedProductsCount,
    savingsPercentage:
      stats.totalPricePoints > 0 ? ((stats.duplicateCount / stats.totalPricePoints) * 100).toFixed(1) : "0",
  })
}

// DELETE: Actually delete the duplicate price points
export async function DELETE() {
  const result = await priceQueries.deleteDuplicatePricePoints()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    message: "Duplicate price points deleted",
    deleted: result.deleted,
    stats: result.stats
      ? {
          totalPricePoints: result.stats.totalPricePoints,
          duplicateCount: result.stats.duplicateCount,
          affectedProductsCount: result.stats.affectedProductsCount,
        }
      : null,
  })
}
