import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/canonical-matches/search?q=milka&limit=10
 * Searches canonical products by barcode, canonical name/brand, and store product name.
 * Returns enriched results with barcodes and sample store product names.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "10"), 30)

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const supabase = createAdminClient()
  const isBarcode = /^\d{4,14}$/.test(q)
  const canonicalIds = new Set<number>()

  if (isBarcode) {
    const { data: tis } = await supabase
      .from("trade_items")
      .select("canonical_product_id")
      .like("gtin", `%${q}%`)
      .not("canonical_product_id", "is", null)
      .limit(50)

    for (const ti of tis ?? []) {
      if (ti.canonical_product_id) canonicalIds.add(ti.canonical_product_id)
    }
  }

  const { data: directMatches } = await supabase
    .from("canonical_products")
    .select("id")
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
    .limit(50)

  for (const c of directMatches ?? []) {
    canonicalIds.add(c.id)
  }

  // Also search store_products by name (skip for pure barcode queries)
  if (!isBarcode && canonicalIds.size < limit) {
    const { data: spMatches } = await supabase
      .from("store_products")
      .select("canonical_product_id")
      .ilike("name", `%${q}%`)
      .not("canonical_product_id", "is", null)
      .limit(100)

    for (const sp of spMatches ?? []) {
      if (sp.canonical_product_id) canonicalIds.add(sp.canonical_product_id)
    }
  }

  if (canonicalIds.size === 0) {
    return NextResponse.json({ data: [] })
  }

  const ids = [...canonicalIds].slice(0, limit)

  const [canonicalsRes, tradeItemsRes, storeProductsRes] = await Promise.all([
    supabase.from("canonical_products").select("id, name, brand").in("id", ids),
    supabase.from("trade_items").select("canonical_product_id, gtin").in("canonical_product_id", ids),
    supabase
      .from("store_products")
      .select("canonical_product_id, name, origin_id")
      .in("canonical_product_id", ids)
      .limit(ids.length * 5),
  ])

  const barcodesByCanonical = new Map<number, string[]>()
  for (const ti of tradeItemsRes.data ?? []) {
    const cid = ti.canonical_product_id as number
    const arr = barcodesByCanonical.get(cid) || []
    arr.push(ti.gtin)
    barcodesByCanonical.set(cid, arr)
  }

  const spByCanonical = new Map<number, { name: string; origin_id: number }[]>()
  for (const sp of storeProductsRes.data ?? []) {
    const cid = sp.canonical_product_id as number
    const arr = spByCanonical.get(cid) || []
    if (arr.length < 3) arr.push({ name: sp.name, origin_id: sp.origin_id })
    spByCanonical.set(cid, arr)
  }

  const enriched = (canonicalsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    barcodes: barcodesByCanonical.get(c.id) ?? [],
    barcodeCount: (barcodesByCanonical.get(c.id) ?? []).length,
    storeProducts: spByCanonical.get(c.id) ?? [],
  }))

  // Multi-barcode canonicals first, then alphabetical
  enriched.sort((a, b) => b.barcodeCount - a.barcodeCount || a.name.localeCompare(b.name))

  return NextResponse.json({ data: enriched })
}
