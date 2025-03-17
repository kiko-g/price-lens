import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { storeProduct } = body

    if (!storeProduct || !storeProduct.id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase.from("store_products").update({ is_essential: false }).eq("id", storeProduct.id)

    if (error) {
      console.error("Error removing product from inflation basket:", error)
      return NextResponse.json({ error: "Failed to remove product from inflation basket" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Product removed from inflation basket" }, { status: 200 })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
