import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 120

/**
 * GET  /api/admin/data-health/compute-worker — Vercel cron target (daily)
 * POST /api/admin/data-health/compute-worker — QStash / manual target
 */
async function handler(req: NextRequest) {
  const triggeredBy = req.method === "GET" ? "cron" : "manual"
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log(`[data-health/compute-worker] Starting snapshot (${triggeredBy})…`)
    const start = performance.now()

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("compute_data_health_snapshot", {
      p_triggered_by: triggeredBy,
    })

    const elapsed = Math.round(performance.now() - start)

    if (error) {
      console.error(`[data-health/compute-worker] RPC error after ${elapsed}ms:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const snapshotId = (data as Record<string, unknown>).snapshot_id
    const durationMs = (data as Record<string, unknown>).duration_ms
    console.log(`[data-health/compute-worker] Snapshot #${snapshotId} computed in ${durationMs}ms`)

    return NextResponse.json({ ok: true, snapshot_id: snapshotId, duration_ms: durationMs })
  } catch (error) {
    console.error("[data-health/compute-worker] Unhandled error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
