import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { AnalyticsSnapshot } from "@/types/analytics"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/analytics
 * Returns the latest precomputed analytics snapshot.
 * Returns 404 if no snapshot exists (user should click Recompute).
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("analytics_snapshots")
      .select("id, computed_at, duration_ms, triggered_by, data")
      .order("computed_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "No analytics snapshot exists yet" }, { status: 404 })
    }

    if (error) {
      throw new Error(`Query error: ${error.message}`)
    }

    return NextResponse.json(data as AnalyticsSnapshot)
  } catch (error) {
    console.error("[admin/analytics] GET error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
