import type { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = createClient()

  try {
    const index = req.nextUrl.searchParams.get("index")
    if (!index) throw new Error("Index is required")

    const { data: product, error } = await supabase.from("products").select("*").eq("id", index).single()

    return NextResponse.json({ ...product }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
