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
    availability_rate: number
  }>
  scrape_freshness: {
    last_1h: number
    last_1h_to_6h: number
    last_6h_to_24h: number
    last_24h_to_48h: number
    older_48h: number
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
}

export interface AnalyticsSnapshot {
  id: number
  computed_at: string
  duration_ms: number
  triggered_by: "cron" | "manual"
  data: AnalyticsSnapshotData
}
