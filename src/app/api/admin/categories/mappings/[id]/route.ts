import { categoryMappingQueries } from "@/lib/queries/canonical-categories"
import { categoryCache } from "@/lib/cache/category-cache"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/categories/mappings/[id]
 * Get a single mapping by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const mappingId = parseInt(id, 10)

  if (isNaN(mappingId)) {
    return NextResponse.json({ error: "Invalid mapping ID" }, { status: 400 })
  }

  const { data, error } = await categoryMappingQueries.getById(mappingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Mapping not found" }, { status: 404 })
  }

  return NextResponse.json({ data })
}

/**
 * PUT /api/admin/categories/mappings/[id]
 * Update a mapping's canonical category
 * Body: { canonical_category_id: number }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const mappingId = parseInt(id, 10)

  if (isNaN(mappingId)) {
    return NextResponse.json({ error: "Invalid mapping ID" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { canonical_category_id } = body

    if (!canonical_category_id || typeof canonical_category_id !== "number") {
      return NextResponse.json({ error: "canonical_category_id is required" }, { status: 400 })
    }

    const { data, error } = await categoryMappingQueries.update(mappingId, canonical_category_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 })
    }

    // Invalidate cache since mapping changed
    categoryCache.invalidateAll()

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/categories/mappings/[id]
 * Delete a mapping
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const mappingId = parseInt(id, 10)

  if (isNaN(mappingId)) {
    return NextResponse.json({ error: "Invalid mapping ID" }, { status: 400 })
  }

  const { error } = await categoryMappingQueries.delete(mappingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Invalidate cache since mapping was deleted
  categoryCache.invalidateAll()

  return NextResponse.json({ success: true })
}
