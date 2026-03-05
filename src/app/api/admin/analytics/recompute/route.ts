import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 60

/**
 * POST /api/admin/analytics/recompute
 * Calls compute_analytics_snapshot() directly and returns when done.
 * ~8-10s on production, well within Vercel timeout.
 */
export async function POST() {
  try {
    console.log("[recompute] Computing analytics snapshot…")
    const start = performance.now()

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("compute_analytics_snapshot", {
      p_triggered_by: "manual",
    })

    const elapsed = Math.round(performance.now() - start)

    if (error) {
      console.error(`[recompute] RPC failed after ${elapsed}ms:`, error.message)
      throw new Error(error.message)
    }

    const snapshotId = (data as Record<string, unknown>).snapshot_id
    const durationMs = (data as Record<string, unknown>).duration_ms
    console.log(`[recompute] Snapshot #${snapshotId} computed in ${durationMs}ms (total ${elapsed}ms)`)

    return NextResponse.json({ status: "completed", snapshot_id: snapshotId, duration_ms: durationMs })
  } catch (error) {
    console.error("[recompute] Failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
