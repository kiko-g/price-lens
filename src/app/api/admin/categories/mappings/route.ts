import { categoryMappingQueries } from "@/lib/queries/canonical-categories"
import { categoryCache } from "@/lib/cache/category-cache"
import type { BulkCreateCategoryMappingInput, CreateCategoryMappingInput } from "@/types"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/categories/mappings
 * Get all category mappings with optional filters
 * Query params:
 *   - origin_id: Filter by store
 *   - canonical_id: Filter by canonical category
 *   - limit: Pagination limit
 *   - offset: Pagination offset
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const origin_id = params.get("origin_id")
  const canonical_id = params.get("canonical_id")
  const limit = params.get("limit")
  const offset = params.get("offset")

  const filters: {
    origin_id?: number
    canonical_category_id?: number
    limit?: number
    offset?: number
  } = {}

  if (origin_id) {
    const parsed = parseInt(origin_id, 10)
    if (!isNaN(parsed)) filters.origin_id = parsed
  }
  if (canonical_id) {
    const parsed = parseInt(canonical_id, 10)
    if (!isNaN(parsed)) filters.canonical_category_id = parsed
  }
  if (limit) {
    const parsed = parseInt(limit, 10)
    if (!isNaN(parsed)) filters.limit = parsed
  }
  if (offset) {
    const parsed = parseInt(offset, 10)
    if (!isNaN(parsed)) filters.offset = parsed
  }

  const { data, error } = await categoryMappingQueries.getAll(filters)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

/**
 * POST /api/admin/categories/mappings
 * Create one or more category mappings
 * Body (single): { origin_id, store_category, store_category_2?, store_category_3?, canonical_category_id }
 * Body (bulk): { mappings: [...] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Check if bulk or single
    if (body.mappings && Array.isArray(body.mappings)) {
      const input = body as BulkCreateCategoryMappingInput

      if (input.mappings.length === 0) {
        return NextResponse.json({ error: "No mappings provided" }, { status: 400 })
      }

      // Validate all mappings
      for (const mapping of input.mappings) {
        if (!mapping.origin_id || !mapping.store_category || !mapping.canonical_category_id) {
          return NextResponse.json(
            { error: "Each mapping requires origin_id, store_category, and canonical_category_id" },
            { status: 400 },
          )
        }
      }

      const { data, error } = await categoryMappingQueries.createBulk(input.mappings)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Invalidate cache since mappings changed
      categoryCache.invalidateAll()

      return NextResponse.json({ data, count: data?.length ?? 0 }, { status: 201 })
    }

    // Single mapping
    const input = body as CreateCategoryMappingInput

    if (!input.origin_id || !input.store_category || !input.canonical_category_id) {
      return NextResponse.json(
        { error: "origin_id, store_category, and canonical_category_id are required" },
        { status: 400 },
      )
    }

    const { data, error } = await categoryMappingQueries.create(input)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Invalidate cache since mappings changed
    categoryCache.invalidateAll()

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
