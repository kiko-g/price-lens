import { NextResponse } from "next/server"
import { qstash, getBaseUrl } from "@/lib/qstash"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 120

/**
 * POST /api/admin/data-health/recompute
 * - Production + CRON_SECRET: queues via QStash
 * - Development: calls RPC directly
 */
export async function POST() {
  try {
    const supabase = createAdminClient()

    const useQStash = process.env.NODE_ENV === "production" && process.env.CRON_SECRET && process.env.QSTASH_TOKEN

    if (useQStash) {
      const baseUrl = getBaseUrl()
      const targetUrl = `${baseUrl}/api/admin/data-health/compute-worker`
      const result = await qstash.publishJSON({
        url: targetUrl,
        body: { triggered_by: "manual" },
        headers: {
          "Upstash-Forward-Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
      })
      console.log(`[data-health/recompute] Queued via QStash: ${result.messageId}`)
      return NextResponse.json({ status: "queued", messageId: result.messageId })
    }

    const { data, error } = await supabase.rpc("compute_data_health_snapshot", {
      p_triggered_by: "manual",
    })
    if (error) throw new Error(error.message)
    const snapshotId = (data as Record<string, unknown>).snapshot_id
    return NextResponse.json({ status: "completed", snapshot_id: snapshotId })
  } catch (error) {
    console.error("[data-health/recompute] Failed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
