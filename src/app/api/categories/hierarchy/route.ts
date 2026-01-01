import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/categories/hierarchy
 *
 * Returns category options based on the current selection level.
 * - No params: returns all unique category values
 * - category: returns all category_2 values under that category
 * - category + category_2: returns all category_3 values under that combination
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const category = params.get("category") ?? ""
  const category2 = params.get("category_2") ?? ""

  const supabase = createClient()

  // Level 1: Get all unique categories
  if (!category) {
    const { data, error } = await supabase
      .from("store_products")
      .select("category")
      .not("category", "is", null)
      .not("category", "eq", "")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const uniqueCategories = [...new Set(data.map((d) => d.category))].filter(Boolean).sort()

    return NextResponse.json(
      { level: 1, options: uniqueCategories },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      },
    )
  }

  // Level 2: Get category_2 options for a given category
  if (category && !category2) {
    const { data, error } = await supabase
      .from("store_products")
      .select("category_2")
      .eq("category", category)
      .not("category_2", "is", null)
      .not("category_2", "eq", "")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const uniqueCategories2 = [...new Set(data.map((d) => d.category_2))].filter(Boolean).sort()

    return NextResponse.json(
      { level: 2, category, options: uniqueCategories2 },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      },
    )
  }

  // Level 3: Get category_3 options for a given category + category_2
  if (category && category2) {
    const { data, error } = await supabase
      .from("store_products")
      .select("category_3")
      .eq("category", category)
      .eq("category_2", category2)
      .not("category_3", "is", null)
      .not("category_3", "eq", "")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const uniqueCategories3 = [...new Set(data.map((d) => d.category_3))].filter(Boolean).sort()

    return NextResponse.json(
      { level: 3, category, category_2: category2, options: uniqueCategories3 },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      },
    )
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}
