import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import type { AnalyticsSnapshot } from "@/types/analytics"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/analytics
 * Returns the latest precomputed analytics snapshot.
 * Falls back to computing live if no snapshot exists.
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

    if (error && error.code !== "PGRST116") {
      throw new Error(`Query error: ${error.message}`)
    }

    if (data) {
      return NextResponse.json(data as AnalyticsSnapshot)
    }

    // No snapshot exists yet — compute one synchronously as a bootstrap
    console.log("[admin/analytics] No snapshot found, computing live…")
    const { data: rpcData, error: rpcError } = await supabase.rpc("compute_analytics_snapshot", {
      p_triggered_by: "manual",
    })

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`)
    }

    const snapshotId = (rpcData as Record<string, unknown>).snapshot_id as number

    const { data: newSnapshot, error: fetchError } = await supabase
      .from("analytics_snapshots")
      .select("id, computed_at, duration_ms, triggered_by, data")
      .eq("id", snapshotId)
      .single()

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`)
    }

    return NextResponse.json(newSnapshot as AnalyticsSnapshot)
  } catch (error) {
    console.error("Overview API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
