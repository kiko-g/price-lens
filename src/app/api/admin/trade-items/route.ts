import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { lookupBarcodeSimple } from "@/lib/canonical/open-food-facts"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search")?.trim() ?? ""
  const filter = searchParams.get("filter") ?? "all" // "all" | "enriched" | "missing"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 50
  const offset = (page - 1) * limit

  const supabase = await createAdminClient()

  let query = supabase
    .from("trade_items")
    .select("id, gtin, gtin_format, gs1_prefix, canonical_product_id, off_product_name, created_at", { count: "exact" })

  if (search) {
    query = query.ilike("gtin", `%${search}%`)
  }

  if (filter === "enriched") {
    query = query.not("off_product_name", "is", null)
  } else if (filter === "missing") {
    query = query.is("off_product_name", null)
  }

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Counts for the stats bar
  const { count: totalCount } = await supabase.from("trade_items").select("id", { count: "exact", head: true })

  const { count: enrichedCount } = await supabase
    .from("trade_items")
    .select("id", { count: "exact", head: true })
    .not("off_product_name", "is", null)

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    limit,
    stats: {
      total: totalCount ?? 0,
      enriched: enrichedCount ?? 0,
      missing: (totalCount ?? 0) - (enrichedCount ?? 0),
    },
  })
}

/**
 * POST: Live OFF lookup for a single barcode (does NOT persist).
 * Body: { barcode: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const barcode = body?.barcode?.trim()

  if (!barcode) {
    return NextResponse.json({ error: "barcode is required" }, { status: 400 })
  }

  const result = await lookupBarcodeSimple(barcode)

  return NextResponse.json({ barcode, off: result })
}
