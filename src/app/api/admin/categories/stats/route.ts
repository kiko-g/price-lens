import { categoryMappingQueries } from "@/lib/queries/canonical-categories"
import { categoryCache } from "@/lib/cache/category-cache"
import { NextResponse } from "next/server"

/**
 * GET /api/admin/categories/stats
 * Get category mapping coverage statistics
 * Results are cached for 5 minutes
 */
export async function GET() {
  // Return cached data if still fresh
  const cached = categoryCache.getStats()
  if (cached) {
    return NextResponse.json({ data: cached.data, cached: true })
  }

  const { data, error } = await categoryMappingQueries.getOverallStats()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update cache
  categoryCache.setStats(data)

  return NextResponse.json({ data })
}
