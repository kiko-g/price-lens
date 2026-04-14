import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 60

/**
 * GET: canonical groups that may be incomplete merges (same brand + identical PVPR, small group).
 *
 * Each canonical in the dataset must have exactly one distinct rounded positive `price_recommended`
 * across its linked store_products (via trade_items). Groups share:
 * - `lower(trim(brand))` on canonical_products
 * - that single PVPR value (rounded to 2 decimals)
 *
 * Query:
 * - minSize (default 2) — minimum number of canonicals in a group
 * - maxExclusive (default 3) — group size must be strictly less than this (so default → only pairs)
 * - source=auto (default) | all
 * - limit (default 100, max 500)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sourceMode = searchParams.get("source") ?? "auto"
  const minSize = Math.min(50, Math.max(2, parseInt(searchParams.get("minSize") ?? "2", 10)))
  const maxExclusive = Math.min(100, Math.max(minSize + 1, parseInt(searchParams.get("maxExclusive") ?? "3", 10)))
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)))

  if (sourceMode !== "auto" && sourceMode !== "all") {
    return NextResponse.json(
      { error: `Invalid source: ${sourceMode}. Use "auto" or "all".` },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc("list_canonical_pvr_split_suspect_groups", {
    p_min_size: minSize,
    p_max_exclusive: maxExclusive,
    p_source: sourceMode,
    p_limit: limit,
  })

  if (error) {
    console.error("[canonical-matches/split-suspects] rpc failed:", error)
    return NextResponse.json(
      {
        error: error.message,
        hint:
          "If this is undefined_function, apply scripts/migrations/038_canonical_pvr_split_suspects.sql to the target database.",
      },
      { status: 500 },
    )
  }

  const groups = data ?? []

  return NextResponse.json({
    filters: {
      minSize,
      maxExclusive,
      source: sourceMode,
      limit,
      interpretation: `Groups with ${minSize} <= size < ${maxExclusive} (integer sizes). Default maxExclusive=3 → only pairs.`,
    },
    groupCount: groups.length,
    groups,
  })
}
