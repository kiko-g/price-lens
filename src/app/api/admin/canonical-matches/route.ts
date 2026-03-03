import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const minStores = parseInt(searchParams.get("minStores") ?? "2")
  const search = searchParams.get("search")?.trim() ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = await createAdminClient()

  const { data: matches, error } = await supabase.rpc("get_canonical_matches", {
    min_stores: minStores,
    search_term: search || null,
    result_limit: limit,
    result_offset: offset,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: countData } = await supabase.rpc("count_canonical_matches", {
    min_stores: minStores,
    search_term: search || null,
  })

  const enriched = await Promise.all(
    (matches ?? []).map(
      async (m: { canonical_id: number; name: string; brand: string; barcodes: number; stores: number }) => {
        const { data: tradeItems } = await supabase
          .from("trade_items")
          .select("id, gtin, off_product_name")
          .eq("canonical_product_id", m.canonical_id)

        const tiIds = (tradeItems ?? []).map((ti: { id: number }) => ti.id)

        const { data: storeProducts } =
          tiIds.length > 0
            ? await supabase
                .from("store_products")
                .select("id, origin_id, name, brand, barcode, price, image, url")
                .in("trade_item_id", tiIds)
                .order("origin_id")
            : { data: [] }

        return {
          canonicalId: m.canonical_id,
          name: m.name,
          brand: m.brand,
          barcodeCount: m.barcodes,
          storeCount: m.stores,
          tradeItems: tradeItems ?? [],
          storeProducts: storeProducts ?? [],
        }
      },
    ),
  )

  return NextResponse.json({
    data: enriched,
    total: countData ?? 0,
    page,
    limit,
  })
}
