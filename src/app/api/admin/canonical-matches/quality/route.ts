import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 60

/**
 * GET: read-only list of suspicious canonicals for manual triage.
 *
 * Query:
 * - type=too_many_gtins (default)
 * - source=auto (default) | all — "all" drops the source filter (finds manual + auto)
 * - minBarcodes=4 (default) — canonical_products.barcode_count >= this value
 * - limit, offset
 *
 * Empty `canonicals` with total=0 usually means data is healthy after Pass 2 gates, or you need
 * source=all / lower minBarcodes to explore.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get("type") ?? "too_many_gtins"
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10))
  const sourceMode = searchParams.get("source") ?? "auto"
  const minBarcodes = Math.min(500, Math.max(1, parseInt(searchParams.get("minBarcodes") ?? "4", 10)))

  const supabase = createAdminClient()

  if (type !== "too_many_gtins") {
    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  }

  if (sourceMode !== "auto" && sourceMode !== "all") {
    return NextResponse.json({ error: `Invalid source: ${sourceMode}. Use "auto" or "all".` }, { status: 400 })
  }

  let listQuery = supabase
    .from("canonical_products")
    .select("id, name, brand, source, barcode_count, store_count, created_at", { count: "exact" })
    .gte("barcode_count", minBarcodes)
    .order("barcode_count", { ascending: false })
    .range(offset, offset + limit - 1)

  if (sourceMode === "auto") {
    listQuery = listQuery.eq("source", "auto")
  }

  const [{ data: rows, error, count }, diagTotal, diagAuto, diagMaxRow] = await Promise.all([
    listQuery,
    supabase.from("canonical_products").select("id", { count: "exact", head: true }),
    supabase.from("canonical_products").select("id", { count: "exact", head: true }).eq("source", "auto"),
    supabase
      .from("canonical_products")
      .select("barcode_count")
      .order("barcode_count", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (error) {
    console.error("[canonical-matches/quality] query failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const maxBarcodeCount = diagMaxRow.data?.barcode_count ?? null
  const resolvedTotal = count ?? rows?.length ?? 0
  const maxBc = maxBarcodeCount ?? 0

  let note: string | undefined
  if (resolvedTotal === 0) {
    if (maxBc < minBarcodes) {
      note =
        `No rows match: the largest barcode_count in this DB is ${maxBc}, which is below minBarcodes (${minBarcodes}). ` +
        `Nothing is wrong with the endpoint — there are simply no “overstuffed” canonicals by this rule. ` +
        `For same-chain duplicate GTINs on one canonical, use the SQL snippet (second query in 07-canonical_quality_suspects.sql).`
    } else {
      note =
        "No rows in this page range; try offset=0 or increase limit. If count is still 0 with offset 0, filters may exclude all rows."
    }
  }

  return NextResponse.json({
    type,
    filters: { source: sourceMode, minBarcodes },
    total: resolvedTotal,
    limit,
    offset,
    canonicals: rows ?? [],
    diagnostics: {
      total_canonical_products: diagTotal.count ?? 0,
      total_auto_canonical_products: diagAuto.count ?? 0,
      max_barcode_count_in_db: maxBarcodeCount,
    },
    ...(note ? { note } : {}),
    hint: "For duplicate GTIN families per chain on the same canonical (not visible via barcode_count alone), run supabase/snippets/07-canonical_quality_suspects.sql query #2 in Studio or psql.",
  })
}
