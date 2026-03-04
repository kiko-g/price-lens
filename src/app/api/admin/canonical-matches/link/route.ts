import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { parseGtin } from "@/lib/gtin"

/**
 * POST /api/admin/canonical-matches/link
 * Link a barcode (trade_item) to a canonical product.
 * Body: { barcode: string, canonicalProductId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { barcode, canonicalProductId } = (await req.json()) as {
      barcode: string
      canonicalProductId: number
    }

    if (!barcode || !canonicalProductId) {
      return NextResponse.json({ error: "barcode and canonicalProductId are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify canonical exists
    const { data: canonical, error: canonErr } = await supabase
      .from("canonical_products")
      .select("id, name, brand")
      .eq("id", canonicalProductId)
      .maybeSingle()

    if (canonErr || !canonical) {
      return NextResponse.json({ error: `Canonical product ${canonicalProductId} not found` }, { status: 404 })
    }

    // Find or create trade_item
    let { data: tradeItem } = await supabase
      .from("trade_items")
      .select("id, gtin, canonical_product_id")
      .eq("gtin", barcode)
      .maybeSingle()

    if (!tradeItem) {
      const parsed = parseGtin(barcode)
      if (!parsed || !parsed.isValid) {
        return NextResponse.json({ error: `Invalid barcode: ${barcode}` }, { status: 400 })
      }

      const { data: created, error: createErr } = await supabase
        .from("trade_items")
        .insert({
          gtin: parsed.normalized,
          gtin_format: parsed.format,
          gs1_prefix: parsed.gs1Prefix,
          source: "admin_manual",
        })
        .select("id, gtin, canonical_product_id")
        .single()

      if (createErr || !created) {
        return NextResponse.json({ error: `Failed to create trade_item: ${createErr?.message}` }, { status: 500 })
      }
      tradeItem = created
    }

    const previousCanonicalId = tradeItem.canonical_product_id

    // Update trade_item with new canonical
    const { error: updateErr } = await supabase
      .from("trade_items")
      .update({ canonical_product_id: canonicalProductId })
      .eq("id", tradeItem.id)

    if (updateErr) {
      return NextResponse.json({ error: `Failed to link: ${updateErr.message}` }, { status: 500 })
    }

    // Also link any store_products that reference this trade_item
    const { error: spLinkErr } = await supabase
      .from("store_products")
      .update({ trade_item_id: tradeItem.id })
      .eq("barcode", barcode)
      .is("trade_item_id", null)

    if (spLinkErr) {
      console.warn(`[link] Failed to link orphan store_products for barcode ${barcode}: ${spLinkErr.message}`)
    }

    // Run denormalization
    const { data: denormCount } = await supabase.rpc("denormalize_canonical_ids")

    return NextResponse.json({
      success: true,
      tradeItemId: tradeItem.id,
      canonicalProductId,
      previousCanonicalId,
      denormalizedCount: denormCount ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/canonical-matches/link
 * Unlink a barcode from its canonical product.
 * Body: { barcode: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { barcode } = (await req.json()) as { barcode: string }

    if (!barcode) {
      return NextResponse.json({ error: "barcode is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: tradeItem } = await supabase
      .from("trade_items")
      .select("id, canonical_product_id")
      .eq("gtin", barcode)
      .maybeSingle()

    if (!tradeItem) {
      return NextResponse.json({ error: `No trade_item found for barcode ${barcode}` }, { status: 404 })
    }

    if (!tradeItem.canonical_product_id) {
      return NextResponse.json({ error: "Trade item is already unlinked" }, { status: 400 })
    }

    const previousCanonicalId = tradeItem.canonical_product_id

    // Clear canonical from trade_item
    const { error: updateErr } = await supabase
      .from("trade_items")
      .update({ canonical_product_id: null })
      .eq("id", tradeItem.id)

    if (updateErr) {
      return NextResponse.json({ error: `Failed to unlink: ${updateErr.message}` }, { status: 500 })
    }

    // Clear canonical from associated store_products
    await supabase.from("store_products").update({ canonical_product_id: null }).eq("trade_item_id", tradeItem.id)

    return NextResponse.json({
      success: true,
      tradeItemId: tradeItem.id,
      previousCanonicalId,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/**
 * GET /api/admin/canonical-matches/link?barcode=XXXX
 * Preview: look up a barcode and return its trade_item + store_products.
 */
export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode")?.trim()

  if (!barcode) {
    return NextResponse.json({ error: "barcode query param is required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find trade_item
  const { data: tradeItem } = await supabase
    .from("trade_items")
    .select("id, gtin, canonical_product_id, off_product_name")
    .eq("gtin", barcode)
    .maybeSingle()

  // Find store_products by barcode
  const { data: storeProducts } = await supabase
    .from("store_products")
    .select("id, origin_id, name, brand, barcode, price, image, url")
    .eq("barcode", barcode)
    .order("origin_id")

  // If trade_item has a canonical, fetch its info
  let currentCanonical: { id: number; name: string; brand: string | null } | null = null
  if (tradeItem?.canonical_product_id) {
    const { data } = await supabase
      .from("canonical_products")
      .select("id, name, brand")
      .eq("id", tradeItem.canonical_product_id)
      .maybeSingle()
    currentCanonical = data
  }

  return NextResponse.json({
    barcode,
    tradeItem: tradeItem ?? null,
    currentCanonical,
    storeProducts: storeProducts ?? [],
  })
}
