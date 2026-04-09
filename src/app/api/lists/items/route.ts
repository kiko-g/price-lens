import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { list_id, store_product_id, quantity = 1 } = await req.json()

  if (!list_id || !store_product_id) {
    return NextResponse.json({ error: "list_id and store_product_id required" }, { status: 400 })
  }

  // Verify list ownership
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", list_id)
    .eq("user_id", user.id)
    .single()

  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 })

  const { data, error } = await supabase
    .from("shopping_list_items")
    .upsert({ list_id, store_product_id, quantity }, { onConflict: "list_id,store_product_id" })
    .select()
    .single()

  // Update list timestamp
  await supabase.from("shopping_lists").update({ updated_at: new Date().toISOString() }).eq("id", list_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { item_id, checked, quantity } = await req.json()

  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (typeof checked === "boolean") updates.checked = checked
  if (typeof quantity === "number") updates.quantity = quantity

  const { data, error } = await supabase.from("shopping_list_items").update(updates).eq("id", item_id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { item_id } = await req.json()
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 })

  const { error } = await supabase.from("shopping_list_items").delete().eq("id", item_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
