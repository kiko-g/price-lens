import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ store_product_id: string }> }) {
  try {
    const { store_product_id } = await params
    const storeProductId = parseInt(store_product_id, 10)

    if (isNaN(storeProductId)) {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ is_favorited: false })
    }

    // Check if product is favorited
    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_product_id", storeProductId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking favorite:", error)
      return NextResponse.json({ error: "Failed to check favorite status" }, { status: 500 })
    }

    return NextResponse.json({
      is_favorited: !!data,
      favorite_id: data?.id || null,
    })
  } catch (error) {
    console.error("Error in favorites check route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
