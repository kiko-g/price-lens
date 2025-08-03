import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_product_id", store_product_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Product already favorited" }, { status: 409 })
    }

    // Add to favorites
    const { data, error } = await supabase
      .from("user_favorites")
      .insert({
        user_id: user.id,
        store_product_id: store_product_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding favorite:", error)
      return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in favorites POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove from favorites
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("store_product_id", store_product_id)

    if (error) {
      console.error("Error removing favorite:", error)
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in favorites DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's favorites with store product details
    const { data, error } = await supabase
      .from("user_favorites")
      .select(
        `
        id,
        created_at,
        store_product_id,
        store_products (*)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching favorites:", error)
      return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in favorites GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
