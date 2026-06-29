import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 120

const KEEP_DAYS = 60
/** First run may have years of backlog — process more days per invocation until caught up. */
const MAX_DAYS_PER_RUN = 90

/**
 * GET  /api/admin/scrape-runs/retention-worker — Vercel cron (daily)
 * POST /api/admin/scrape-runs/retention-worker — manual trigger
 *
 * Rolls up scrape_runs older than 60d into scrape_runs_daily, then deletes raw rows.
 */
async function handler(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const triggeredBy = req.method === "GET" ? "cron" : "manual"
    console.log(`[scrape-runs/retention-worker] Starting (${triggeredBy})…`)
    const start = performance.now()

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc("rollup_scrape_runs_retention", {
      p_keep_days: KEEP_DAYS,
      p_max_days: MAX_DAYS_PER_RUN,
    })

    const elapsed = Math.round(performance.now() - start)

    if (error) {
      console.error(`[scrape-runs/retention-worker] RPC error after ${elapsed}ms:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[scrape-runs/retention-worker] Done in ${elapsed}ms:`, data)
    return NextResponse.json({ ok: true, elapsed_ms: elapsed, ...(data as Record<string, unknown>) })
  } catch (error) {
    console.error("[scrape-runs/retention-worker] Unhandled error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
