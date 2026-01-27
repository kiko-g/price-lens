import { NextRequest, NextResponse } from "next/server"
import { canonicalCategoryQueries } from "@/lib/queries/canonical-categories"

/**
 * GET /api/categories/canonical
 * 
 * Public endpoint for fetching canonical categories for the filter UI.
 * Returns the hierarchical tree structure by default.
 * 
 * Query Parameters:
 * - format: "tree" (default) | "flat"
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const format = params.get("format") ?? "tree"

    if (format === "flat") {
      const { data, error } = await canonicalCategoryQueries.getAll()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data })
    }

    // Default: tree format
    const { data, error } = await canonicalCategoryQueries.getTree()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/categories/canonical] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
