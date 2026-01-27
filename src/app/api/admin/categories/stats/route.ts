import { categoryMappingQueries } from "@/lib/queries/canonical-categories"
import { categoryCache } from "@/lib/cache/category-cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/categories/stats
 * Get category mapping coverage statistics
 * Results are cached for 5 minutes
 * Use ?refresh=true to bypass cache
 */
export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "true"

  // Return cached data if still fresh (unless refresh requested)
  if (!refresh) {
    const cached = categoryCache.getStats()
    if (cached) {
      return NextResponse.json({ data: cached.data, cached: true })
    }
  } else {
    // Clear all caches when refresh is requested
    categoryCache.invalidateAll()
  }

  const { data, error } = await categoryMappingQueries.getOverallStats()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update cache
  categoryCache.setStats(data)

  return NextResponse.json({ data })
}
