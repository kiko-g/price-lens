import type { SupabaseClient } from "@supabase/supabase-js"
import type { LaneQuotas } from "@/lib/business/scrape-budget"
import type { LaneFillStats } from "@/lib/business/scheduler-lanes"
import type { Database, Json } from "@/types/supabase"

export type SchedulerRunRecord = {
  startedAt: Date
  durationMs: number
  scheduledTotal: number
  batchesSent: number
  dryRun: boolean
  laneQuotas: LaneQuotas
  laneFill: LaneFillStats
  byLane?: Record<string, number>
  byPriority?: Record<number, number>
  qstashError?: string
  error?: string
}

export async function persistSchedulerRun(
  supabase: SupabaseClient<Database>,
  record: SchedulerRunRecord,
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("scheduler_runs")
      .insert({
        started_at: record.startedAt.toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: record.durationMs,
        scheduled_total: record.scheduledTotal,
        batches_sent: record.batchesSent,
        dry_run: record.dryRun,
        lane_quotas: record.laneQuotas as unknown as Json,
        lane_fill: record.laneFill as unknown as Json,
        by_lane: (record.byLane ?? null) as Json | null,
        by_priority: (record.byPriority ?? null) as Json | null,
        qstash_error: record.qstashError ?? null,
        error: record.error ?? null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[Scheduler] Failed to persist scheduler_run:", error)
      return null
    }

    return data?.id ?? null
  } catch (err) {
    console.error("[Scheduler] persistSchedulerRun error:", err)
    return null
  }
}
