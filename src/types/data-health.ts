export type SloStatus = "ok" | "warn" | "breach"
export type SloDirection = "higher_better" | "lower_better"

export interface DataHealthSlo {
  key: string
  label: string
  value: number
  target: number
  unit: string
  direction: SloDirection
  status: SloStatus
}

export interface PriorityFreshness {
  priority: number
  fresh: number
  total: number
  fresh_pct: number
  threshold_hours: number
}

export interface LanePeriodStats {
  requested: number
  filled: number
  fill_pct: number
  backlog_sum?: number
}

export interface LaneScrapeStats {
  total: number
  success: number
  failed?: number
  success_rate: number
}

export interface DataHealthSnapshotData {
  slos: DataHealthSlo[]
  freshness: {
    by_priority: PriorityFreshness[]
  }
  backlog: {
    skeleton_total: number
    untriaged: number
    parked: number
    vetoed: number
    triage_24h: number
    triage_7d: number
    skeleton_intake_7d: number
    net_skeleton_pressure: number
  }
  lanes: {
    h48: {
      scheduler_runs: number
      sla: LanePeriodStats
      healing: LanePeriodStats
      long_tail: LanePeriodStats
      scrape_runs: {
        sla: LaneScrapeStats
        healing: LaneScrapeStats
        long_tail: LaneScrapeStats
      }
    }
    d7: {
      scheduler_runs: number
      sla: LanePeriodStats
      healing: LanePeriodStats
      long_tail: LanePeriodStats
      scrape_runs: {
        sla: LaneScrapeStats
        healing: LaneScrapeStats
        long_tail: LaneScrapeStats
      }
    }
  }
  zombies: {
    unavailable_total: number
    stale_30d: number
    stale_45d: number
    false_zombie: number
    no_barcode_pct: number
  }
  volatility: {
    with_stats_pct: number
    with_stats_count: number
    available_total: number
    last_update: string | null
  }
  discovery: {
    per_origin: Array<{
      origin_id: number
      runs_30d: number
      last_run_at: string | null
      urls_new_30d: number
    }>
    urls_new_7d: number
    runs_7d: number
  }
  pipeline: {
    discovery_urls_new_7d: number
    triage_7d: number
    skeleton_total: number
    lane_scheduled_48h: number
    scrape_success_48h: number
  }
  db: {
    size_bytes: number
    size_mb: number
    weekly_price_rows: Array<{ week: string; count: number }>
    current_week_price_rows: number
    prev_week_price_rows: number
    p1_rotation_days: number | null
  }
}

export interface DataHealthSnapshot {
  id: number
  computed_at: string
  duration_ms: number
  triggered_by: "cron" | "manual"
  data: DataHealthSnapshotData
}

export interface DataHealthHistoryPoint {
  computed_at: string
  slos: DataHealthSlo[]
}

export type CohortType = "zombie" | "skeleton" | "false_zombie" | "parked"

export interface CohortSampleRow {
  id: number
  origin_id: number | null
  name: string | null
  barcode: string | null
  available: boolean
  scraped_at: string | null
  last_http_status: number | null
  priority: number | null
  priority_source: string | null
  url: string | null
}

export interface CohortResponse {
  type: CohortType
  total: number
  sample: CohortSampleRow[]
}

export interface SuccessorSuggestion {
  predecessor_id: number
  predecessor_name: string | null
  predecessor_barcode: string | null
  successor_id: number
  successor_name: string | null
  successor_barcode: string | null
  origin_id: number
  brand: string | null
  category: string | null
  confidence: "low" | "medium"
}

export interface SuccessorsResponse {
  total: number
  suggestions: SuccessorSuggestion[]
}
