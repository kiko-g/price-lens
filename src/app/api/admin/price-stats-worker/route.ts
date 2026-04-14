import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 120

const DEFAULT_BATCH = 2000
const MAX_LOOPS = 25

/**
 * GET /api/admin/price-stats-worker — cron: refresh denormalized price volatility columns in batches.
 * POST — manual trigger (e.g. QStash).
 */
async function handler(req: NextRequest) {
  const triggeredBy = req.method === "GET" ? "cron" : "manual"
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const urlBatch = req.nextUrl.searchParams.get("batch")
    const batchSize = urlBatch ? Math.min(5000, Math.max(200, parseInt(urlBatch, 10) || DEFAULT_BATCH)) : DEFAULT_BATCH

    let totalProcessed = 0
    let loops = 0
    const started = performance.now()

    while (loops < MAX_LOOPS) {
      const { data, error } = await supabase.rpc("refresh_store_product_price_stats_batch", {
        p_batch_size: batchSize,
      })

      if (error) {
        console.error("[price-stats-worker] RPC error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const payload = data as { processed?: number } | null
      const processed = typeof payload?.processed === "number" ? payload.processed : 0
      totalProcessed += processed
      loops++

      if (processed === 0) break
    }

    const elapsed = Math.round(performance.now() - started)
    console.log(
      `[price-stats-worker] ${triggeredBy}: processed ${totalProcessed} rows in ${loops} batch(es), ${elapsed}ms`,
    )

    return NextResponse.json({
      ok: true,
      triggered_by: triggeredBy,
      total_processed: totalProcessed,
      batches_run: loops,
      duration_ms: elapsed,
    })
  } catch (err) {
    console.error("[price-stats-worker] Unhandled error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export const GET = handler
export const POST = handler
