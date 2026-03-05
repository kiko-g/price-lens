import { NextResponse } from "next/server"
import { qstash, getBaseUrl } from "@/lib/qstash"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/analytics/recompute
 * Triggers an analytics snapshot recomputation.
 * - Production: queues via QStash (returns immediately)
 * - Development: calls the RPC directly (QStash can't reach localhost)
 */
export async function POST() {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[recompute] Dev mode — computing directly…")
      const supabase = createAdminClient()
      const { data, error } = await supabase.rpc("compute_analytics_snapshot", {
        p_triggered_by: "manual",
      })
      if (error) throw new Error(error.message)

      const snapshotId = (data as Record<string, unknown>).snapshot_id
      return NextResponse.json({ status: "completed", snapshot_id: snapshotId })
    }

    const baseUrl = getBaseUrl()
    const targetUrl = `${baseUrl}/api/admin/analytics/compute-worker`

    const result = await qstash.publishJSON({
      url: targetUrl,
      body: { triggered_by: "manual" },
    })

    console.log(`[recompute] Queued analytics snapshot via QStash: ${result.messageId}`)
    return NextResponse.json({ status: "queued", messageId: result.messageId })
  } catch (error) {
    console.error("[recompute] Failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
