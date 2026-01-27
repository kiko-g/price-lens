import { categoryMappingQueries } from "@/lib/queries/canonical-categories"
import { categoryCache } from "@/lib/cache/category-cache"
import { NextRequest, NextResponse } from "next/server"
import type { StoreCategoryTuple } from "@/types"

/**
 * GET /api/admin/categories/tuples
 * Get all unique store category tuples with mapping status
 * Results are cached for 5 minutes, filtering/pagination applied in memory
 * Query params:
 *   - origin_id: Filter by store
 *   - mapped: "true" or "false" to filter by mapping status
 *   - search: Search in category names
 *   - limit: Pagination limit
 *   - offset: Pagination offset
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const origin_id = params.get("origin_id")
  const mapped = params.get("mapped")
  const search = params.get("search")
  const limit = params.get("limit")
  const offset = params.get("offset")

  // Get all tuples (from cache or fresh)
  let allTuples: StoreCategoryTuple[]

  const cached = categoryCache.getTuples()
  if (cached) {
    allTuples = cached.data
  } else {
    // Fetch all tuples without filters (we'll filter in memory)
    const { data, error } = await categoryMappingQueries.getStoreTuplesWithMappingStatus()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    allTuples = data ?? []
    categoryCache.setTuples(allTuples)
  }

  // Apply filters in memory
  let result = [...allTuples]

  if (origin_id) {
    const originIdNum = parseInt(origin_id, 10)
    if (!isNaN(originIdNum)) {
      result = result.filter((t) => t.origin_id === originIdNum)
    }
  }

  if (mapped === "true") {
    result = result.filter((t) => t.is_mapped)
  } else if (mapped === "false") {
    result = result.filter((t) => !t.is_mapped)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    result = result.filter(
      (t) =>
        t.store_category.toLowerCase().includes(searchLower) ||
        t.store_category_2?.toLowerCase().includes(searchLower) ||
        t.store_category_3?.toLowerCase().includes(searchLower),
    )
  }

  const totalCount = result.length

  // Apply pagination
  if (limit) {
    const limitNum = parseInt(limit, 10)
    const offsetNum = offset ? parseInt(offset, 10) : 0
    if (!isNaN(limitNum)) {
      result = result.slice(offsetNum, offsetNum + limitNum)
    }
  }

  return NextResponse.json({ data: result, count: totalCount })
}
