import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("shopping_lists")
    .select(
      `
      id, name, created_at, updated_at,
      shopping_list_items (
        id, store_product_id, quantity, checked,
        store_products (id, name, brand, image, price, origin_id, available)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lists: data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name = "My List" } = await req.json()

  const { data, error } = await supabase.from("shopping_lists").insert({ user_id: user.id, name }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ list: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { list_id } = await req.json()
  if (!list_id) return NextResponse.json({ error: "list_id required" }, { status: 400 })

  const { error } = await supabase.from("shopping_lists").delete().eq("id", list_id).eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
