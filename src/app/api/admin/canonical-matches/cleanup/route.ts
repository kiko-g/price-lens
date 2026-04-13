import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 60

/**
 * GET: list canonical_products with store_count >= 4 (shouldn't exist with 3 supermarkets)
 * POST: attempt to split over-linked groups by unlinking duplicate store_products
 */
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("canonical_products")
    .select("id, name, brand, store_count, barcode_count, created_at")
    .gte("store_count", 4)
    .order("store_count", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const details = await Promise.all(
    (data || []).map(async (cp) => {
      const { data: linkedProducts } = await supabase
        .from("store_products")
        .select("id, name, brand, origin_id, barcode, url")
        .eq("canonical_product_id", cp.id)

      const { data: linkedTradeItems } = await supabase
        .from("trade_items")
        .select("id, gtin, off_product_name, canonical_product_id")
        .eq("canonical_product_id", cp.id)

      return {
        ...cp,
        linked_store_products: linkedProducts || [],
        linked_trade_items: linkedTradeItems || [],
      }
    }),
  )

  return NextResponse.json({
    count: details.length,
    canonicals: details,
  })
}

export async function POST() {
  const supabase = createAdminClient()

  const { data: overlinked, error } = await supabase
    .from("canonical_products")
    .select("id, name, store_count")
    .gte("store_count", 4)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!overlinked?.length) {
    return NextResponse.json({ message: "No over-linked canonicals found", fixed: 0 })
  }

  let fixed = 0
  const results: Array<{ canonical_id: number; action: string }> = []

  for (const cp of overlinked) {
    const { data: storeProducts } = await supabase
      .from("store_products")
      .select("id, origin_id, barcode, name")
      .eq("canonical_product_id", cp.id)
      .order("origin_id")

    if (!storeProducts) continue

    // Group by origin_id — keep only one per store (the one with a barcode, or the first)
    const byStore = new Map<number, typeof storeProducts>()
    for (const sp of storeProducts) {
      const existing = byStore.get(sp.origin_id) || []
      existing.push(sp)
      byStore.set(sp.origin_id, existing)
    }

    const toUnlink: number[] = []
    for (const [, products] of byStore) {
      if (products.length <= 1) continue
      // Keep the one with a barcode, unlink the rest
      const sorted = [...products].sort((a, b) => {
        if (a.barcode && !b.barcode) return -1
        if (!a.barcode && b.barcode) return 1
        return 0
      })
      for (let i = 1; i < sorted.length; i++) {
        toUnlink.push(sorted[i].id)
      }
    }

    if (toUnlink.length > 0) {
      await supabase.from("store_products").update({ canonical_product_id: null }).in("id", toUnlink)

      fixed += toUnlink.length
      results.push({
        canonical_id: cp.id,
        action: `Unlinked ${toUnlink.length} duplicate store_products: [${toUnlink.join(", ")}]`,
      })
    }
  }

  if (fixed > 0) {
    for (;;) {
      const { data, error } = await supabase.rpc("refresh_canonical_counts_batch", { batch_size: 2000 })
      if (error) {
        console.error("[canonical-matches/cleanup] refresh_canonical_counts_batch failed:", error)
        break
      }
      const n = typeof data === "number" ? data : 0
      if (n === 0) break
    }
  }

  return NextResponse.json({
    message: `Processed ${overlinked.length} over-linked canonicals`,
    fixed,
    results,
  })
}
