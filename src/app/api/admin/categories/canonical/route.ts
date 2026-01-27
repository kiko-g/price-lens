import { canonicalCategoryQueries } from "@/lib/queries/canonical-categories"
import type { CreateCanonicalCategoryInput } from "@/types"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/admin/categories/canonical
 * Returns all canonical categories as a tree or flat list
 * Query params:
 *   - format: "tree" | "flat" (default: "tree")
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const format = params.get("format") ?? "tree"

  if (format === "tree") {
    const { data, error } = await canonicalCategoryQueries.getTree()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  const { data, error } = await canonicalCategoryQueries.getAll()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

/**
 * POST /api/admin/categories/canonical
 * Create a new canonical category
 * Body: { name: string, parent_id?: number, level: 1 | 2 | 3 }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCanonicalCategoryInput

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!body.level || ![1, 2, 3].includes(body.level)) {
      return NextResponse.json({ error: "Level must be 1, 2, or 3" }, { status: 400 })
    }

    const { data, error } = await canonicalCategoryQueries.create(body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
