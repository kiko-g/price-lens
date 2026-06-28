import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { SuccessorSuggestion, SuccessorsResponse } from "@/types/data-health"

const SUGGESTION_LIMIT = 50

/**
 * GET /api/admin/data-health/successors
 * Read-only heuristic successor suggestions (v0 — no writes).
 * Matches unavailable products to newer same-brand/category SKUs at the same store.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc("suggest_product_successors", {
      p_limit: SUGGESTION_LIMIT,
    })

    if (error) {
      console.error("[admin/data-health/successors] RPC error, using fallback:", error.message)
      const fallback = await fetchSuccessorsFallback(supabase)
      return NextResponse.json(fallback)
    }

    const suggestions = (Array.isArray(data) ? data : []) as SuccessorSuggestion[]
    return NextResponse.json({ total: suggestions.length, suggestions } satisfies SuccessorsResponse)
  } catch (error) {
    console.error("[admin/data-health/successors] GET error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

async function fetchSuccessorsFallback(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<SuccessorsResponse> {
  const staleCutoff = new Date(Date.now() - 30 * 86400000).toISOString()
  const newCutoff = new Date(Date.now() - 90 * 86400000).toISOString()

  const { data: predecessors, error: predError } = await supabase
    .from("store_products")
    .select("id, name, barcode, brand, category, origin_id")
    .eq("available", false)
    .not("brand", "is", null)
    .not("category", "is", null)
    .lt("scraped_at", staleCutoff)
    .order("scraped_at", { ascending: true })
    .limit(200)

  if (predError) throw new Error(predError.message)
  if (!predecessors?.length) return { total: 0, suggestions: [] }

  const suggestions: SuccessorSuggestion[] = []

  for (const pred of predecessors) {
    if (suggestions.length >= SUGGESTION_LIMIT) break
    if (!pred.origin_id || !pred.brand || !pred.category) continue

    const { data: candidates } = await supabase
      .from("store_products")
      .select("id, name, barcode")
      .eq("origin_id", pred.origin_id)
      .eq("brand", pred.brand)
      .eq("category", pred.category)
      .eq("available", true)
      .gte("created_at", newCutoff)
      .neq("id", pred.id)
      .limit(3)

    for (const cand of candidates ?? []) {
      if (cand.barcode && pred.barcode && cand.barcode === pred.barcode) continue
      suggestions.push({
        predecessor_id: pred.id,
        predecessor_name: pred.name,
        predecessor_barcode: pred.barcode,
        successor_id: cand.id,
        successor_name: cand.name,
        successor_barcode: cand.barcode,
        origin_id: pred.origin_id,
        brand: pred.brand,
        category: pred.category,
        confidence: pred.barcode && cand.barcode ? "medium" : "low",
      })
      if (suggestions.length >= SUGGESTION_LIMIT) break
    }
  }

  return { total: suggestions.length, suggestions }
}
