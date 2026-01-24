import { NextRequest, NextResponse } from "next/server"
import { findRelatedProducts } from "@/lib/queries/product-matching"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "10")

  // Get current user for favorites
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await findRelatedProducts(id, limit, user?.id || null)

  if (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }

  return NextResponse.json(data)
}
