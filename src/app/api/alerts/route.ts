import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("price_alert_subscriptions")
    .select(
      `
      id, store_product_id, threshold_type, threshold_value, is_active, created_at,
      store_products (id, name, brand, image, price, origin_id, available)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts: data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { store_product_id, threshold_type = "any_drop", threshold_value } = body

  if (!store_product_id) {
    return NextResponse.json({ error: "store_product_id is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("price_alert_subscriptions")
    .upsert(
      {
        user_id: user.id,
        store_product_id,
        threshold_type,
        threshold_value: threshold_value ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,store_product_id" },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alert: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { store_product_id } = await req.json()

  if (!store_product_id) {
    return NextResponse.json({ error: "store_product_id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("price_alert_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("store_product_id", store_product_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
