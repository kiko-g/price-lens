import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 120

/**
 * GET  /api/admin/analytics/compute-worker — Vercel cron target (every 12h)
 * POST /api/admin/analytics/compute-worker — QStash target (manual recompute)
 *
 * Calls compute_analytics_snapshot() RPC which aggregates all KPIs
 * and inserts a new row into analytics_snapshots.
 */
async function handler(req: NextRequest) {
  const triggeredBy = req.method === "GET" ? "cron" : "manual"

  try {
    console.log(`[compute-worker] Starting analytics snapshot (${triggeredBy})…`)
    const start = performance.now()

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("compute_analytics_snapshot", {
      p_triggered_by: triggeredBy,
    })

    const elapsed = Math.round(performance.now() - start)

    if (error) {
      console.error(`[compute-worker] RPC error after ${elapsed}ms:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const snapshotId = (data as Record<string, unknown>).snapshot_id
    const durationMs = (data as Record<string, unknown>).duration_ms
    console.log(`[compute-worker] Snapshot #${snapshotId} computed in ${durationMs}ms (total ${elapsed}ms)`)

    return NextResponse.json({ ok: true, snapshot_id: snapshotId, duration_ms: durationMs })
  } catch (error) {
    console.error("[compute-worker] Unhandled error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
