export type CapacityHealthStatus = "healthy" | "degraded" | "critical"

export interface PriorityHealthStats {
  priority: number | null
  total: number
  fresh: number
  stale_actionable: number
  unavailable: number
  never_scraped: number
  staleness_threshold_hours: number | null
  is_active: boolean
}

export interface AnalyticsSnapshotData {
  scrape_status: {
    total: number
    available: number
    unavailable: number
    never_scraped: number
    availability_rate: number
  }
  per_store: Array<{
    origin_id: number
    name: string
    total: number
    available: number
    unavailable: number
    on_discount: number
    availability_rate: number
  }>
  scrape_freshness: {
    within_24h: number
    within_48h: number
    within_3d: number
    within_7d: number
    within_14d: number
    older_14d: number
    never: number
  }
  scrape_velocity: {
    avg_per_hour_24h: number
  }
  price_intelligence: {
    total_price_points: number
    new_prices_24h: number
    new_prices_7d: number
    increases_24h: number
    decreases_24h: number
    unchanged_24h: number
    products_with_discount: number
    total_savings_euros_24h: number
    total_discount_savings_euros: number
  }
  data_quality: {
    with_barcode: number
    barcode_coverage_pct: number
    with_canonical: number
    canonical_match_rate: number
    with_trade_item: number
    trade_item_coverage: number
    with_category: number
    category_coverage_pct: number
  }
  priority_distribution: {
    p0: number
    p1: number
    p2: number
    p3: number
    p4: number
    p5: number
    unassigned: number
  }
  growth: {
    new_products_7d: number
    new_prices_7d: number
  }
  scheduler_capacity: {
    status: CapacityHealthStatus
    required_daily_scrapes: number
    available_daily_capacity: number
    utilization_pct: number
    deficit: number
    surplus_pct: number
    config: {
      batch_size: number
      max_batches: number
      cron_frequency_minutes: number
      runs_per_day: number
      active_priorities: number[]
    }
  }
  scrape_runs_24h: {
    total_batches: number
    total_products: number
    total_success: number
    total_failed: number
    success_rate: number
    avg_batch_duration_ms: number
  }
  priority_health: PriorityHealthStats[]
}

export interface AnalyticsSnapshot {
  id: number
  computed_at: string
  duration_ms: number
  triggered_by: "cron" | "manual"
  data: AnalyticsSnapshotData
}
