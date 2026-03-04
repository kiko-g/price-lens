import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const view = searchParams.get("view") ?? "matches"

  if (view === "orphans") {
    return getOrphans(req)
  }

  return getMatches(req)
}

async function getMatches(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const minStores = parseInt(searchParams.get("minStores") ?? "2")
  const search = searchParams.get("search")?.trim() ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  const [{ data: matches, error }, { data: countData }] = await Promise.all([
    supabase.rpc("get_canonical_matches", {
      min_stores: minStores,
      search_term: search || null,
      result_limit: limit,
      result_offset: offset,
    }),
    supabase.rpc("count_canonical_matches", {
      min_stores: minStores,
      search_term: search || null,
    }),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({ data: [], total: countData ?? 0, page, limit })
  }

  const canonicalIds = matches.map(
    (m: { canonical_id: number }) => m.canonical_id,
  )

  // Batch: all trade_items for these canonicals in one query
  const { data: allTradeItems } = await supabase
    .from("trade_items")
    .select("id, gtin, off_product_name, canonical_product_id")
    .in("canonical_product_id", canonicalIds)

  const tiByCanonical = new Map<number, typeof allTradeItems>()
  const allTiIds: number[] = []
  for (const ti of allTradeItems ?? []) {
    const cid = (ti as { canonical_product_id: number }).canonical_product_id
    const group = tiByCanonical.get(cid) || []
    group.push(ti)
    tiByCanonical.set(cid, group)
    allTiIds.push(ti.id)
  }

  // Batch: all store_products for those trade_items in one query
  let allStoreProducts: {
    id: number
    origin_id: number
    name: string
    brand: string | null
    barcode: string | null
    price: number | null
    image: string | null
    url: string | null
    trade_item_id: number
  }[] = []
  if (allTiIds.length > 0) {
    const { data } = await supabase
      .from("store_products")
      .select("id, origin_id, name, brand, barcode, price, image, url, trade_item_id")
      .in("trade_item_id", allTiIds)
      .order("origin_id")
    allStoreProducts = (data ?? []) as typeof allStoreProducts
  }

  const spByTiId = new Map<number, typeof allStoreProducts>()
  for (const sp of allStoreProducts) {
    const group = spByTiId.get(sp.trade_item_id) || []
    group.push(sp)
    spByTiId.set(sp.trade_item_id, group)
  }

  const enriched = matches.map(
    (m: { canonical_id: number; name: string; brand: string; barcodes: number; stores: number }) => {
      const tradeItems = tiByCanonical.get(m.canonical_id) ?? []
      const storeProducts = tradeItems.flatMap(
        (ti: { id: number }) => spByTiId.get(ti.id) ?? [],
      )
      return {
        canonicalId: m.canonical_id,
        name: m.name,
        brand: m.brand,
        barcodeCount: m.barcodes,
        storeCount: m.stores,
        tradeItems,
        storeProducts,
      }
    },
  )

  return NextResponse.json({
    data: enriched,
    total: countData ?? 0,
    page,
    limit,
  })
}

async function getOrphans(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search")?.trim() ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  // Orphans = trade_items in single-barcode canonicals (no siblings).
  // These are candidates for manual re-linking to multi-barcode groups.
  const { data: countData } = await supabase.rpc("count_orphan_trade_items", {
    search_term: search || null,
  })

  const { data: orphanTis, error } = await supabase.rpc("get_orphan_trade_items", {
    search_term: search || null,
    result_limit: limit,
    result_offset: offset,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orphanTis || orphanTis.length === 0) {
    return NextResponse.json({ data: [], total: countData ?? 0, page, limit })
  }

  // Fetch store_products for these trade_items
  const tiIds = orphanTis.map((ti: { trade_item_id: number }) => ti.trade_item_id)
  const { data: storeProducts } = await supabase
    .from("store_products")
    .select("id, origin_id, name, brand, barcode, price, image, url, trade_item_id")
    .in("trade_item_id", tiIds)
    .order("origin_id")

  const spByTiId = new Map<number, typeof storeProducts>()
  for (const sp of storeProducts ?? []) {
    const tiId = (sp as { trade_item_id: number }).trade_item_id
    const group = spByTiId.get(tiId) || []
    group.push(sp)
    spByTiId.set(tiId, group)
  }

  interface OrphanRow {
    trade_item_id: number
    gtin: string
    off_product_name: string | null
    gs1_prefix: string | null
    canonical_product_id: number | null
    canonical_name: string | null
    canonical_brand: string | null
  }

  const enriched = (orphanTis as OrphanRow[]).map((ti) => {
    const sps = spByTiId.get(ti.trade_item_id) ?? []
    const brands = [...new Set((sps ?? []).map((sp: { brand: string | null }) => sp.brand).filter(Boolean))]
    return {
      tradeItemId: ti.trade_item_id,
      gtin: ti.gtin,
      offProductName: ti.off_product_name,
      gs1Prefix: ti.gs1_prefix,
      canonicalId: ti.canonical_product_id,
      canonicalName: ti.canonical_name,
      brand: brands[0] ?? ti.canonical_brand ?? null,
      storeProducts: sps ?? [],
    }
  })

  return NextResponse.json({
    data: enriched,
    total: countData ?? 0,
    page,
    limit,
  })
}
