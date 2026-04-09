import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ has_alert: false })
  }

  const storeProductId = req.nextUrl.searchParams.get("store_product_id")
  if (!storeProductId) {
    return NextResponse.json({ error: "store_product_id required" }, { status: 400 })
  }

  const { data } = await supabase
    .from("price_alert_subscriptions")
    .select("id, threshold_type, is_active")
    .eq("user_id", user.id)
    .eq("store_product_id", parseInt(storeProductId))
    .eq("is_active", true)
    .maybeSingle()

  return NextResponse.json({ has_alert: !!data, alert: data })
}
