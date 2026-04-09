import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Fire-and-forget product view tracking.
 * Called from the product detail page client-side.
 */
export async function POST(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()
    if (!store_product_id) {
      return NextResponse.json({ error: "store_product_id required" }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert view (fire-and-forget, don't block on this)
    await supabase.from("product_views").insert({
      store_product_id,
      user_id: user?.id || null,
    })

    // Also log daily visit for streak tracking if user is logged in
    if (user) {
      await supabase.from("user_activity_log").upsert(
        {
          user_id: user.id,
          activity_type: "daily_visit",
          activity_date: new Date().toISOString().split("T")[0],
        },
        { onConflict: "user_id,activity_type,activity_date" },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
