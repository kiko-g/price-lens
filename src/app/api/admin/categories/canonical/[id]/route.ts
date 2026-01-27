import { canonicalCategoryQueries } from "@/lib/queries/canonical-categories"
import type { UpdateCanonicalCategoryInput } from "@/types"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/categories/canonical/[id]
 * Get a single canonical category by ID
 * Query params:
 *   - ancestry: "true" to include full ancestry path
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const categoryId = parseInt(id, 10)

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
  }

  const withAncestry = req.nextUrl.searchParams.get("ancestry") === "true"

  if (withAncestry) {
    const { data, error } = await canonicalCategoryQueries.getWithAncestry(categoryId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    return NextResponse.json({ data, category: data[data.length - 1] })
  }

  const { data, error } = await canonicalCategoryQueries.getById(categoryId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  return NextResponse.json({ data })
}

/**
 * PUT /api/admin/categories/canonical/[id]
 * Update a canonical category
 * Body: { name?: string, parent_id?: number | null }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const categoryId = parseInt(id, 10)

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
  }

  try {
    const body = (await req.json()) as UpdateCanonicalCategoryInput

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await canonicalCategoryQueries.update(categoryId, body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/categories/canonical/[id]
 * Delete a canonical category (cascades to children and mappings)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const categoryId = parseInt(id, 10)

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
  }

  const { error } = await canonicalCategoryQueries.delete(categoryId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
