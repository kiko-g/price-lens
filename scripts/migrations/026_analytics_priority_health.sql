-- Migration: Replace staleness_breakdown (time-bucket cards) with priority_health
-- (per-priority fresh/stale/unavailable stats) in compute_analytics_snapshot.
-- This merges the old priority_distribution simple counts and staleness_breakdown
-- into a single richer per-priority health view.

CREATE OR REPLACE FUNCTION compute_analytics_snapshot(p_triggered_by TEXT DEFAULT 'cron')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120s'
AS $$
DECLARE
  v_start  TIMESTAMPTZ;
  v_data   JSONB;
  v_dur_ms INT;
  v_id     BIGINT;
BEGIN
  v_start := clock_timestamp();

  WITH
  sp_counts AS (
    SELECT
      count(*)::INT AS total,
      count(*) FILTER (WHERE available = true)::INT AS available,
      count(*) FILTER (WHERE available = false)::INT AS unavailable,
      count(*) FILTER (WHERE scraped_at IS NULL AND url IS NOT NULL)::INT AS never_scraped,
      count(*) FILTER (WHERE scraped_at >= now() - interval '24 hours')::INT AS scraped_24h,
      count(*) FILTER (WHERE barcode IS NOT NULL)::INT AS with_barcode,
      count(*) FILTER (WHERE canonical_product_id IS NOT NULL)::INT AS with_canonical,
      count(*) FILTER (WHERE trade_item_id IS NOT NULL)::INT AS with_trade_item,
      count(*) FILTER (WHERE category IS NOT NULL)::INT AS with_category,
      count(*) FILTER (WHERE available = true AND discount IS NOT NULL AND discount > 0)::INT AS with_discount,
      count(*) FILTER (WHERE priority = 0)::INT AS p0,
      count(*) FILTER (WHERE priority = 1)::INT AS p1,
      count(*) FILTER (WHERE priority = 2)::INT AS p2,
      count(*) FILTER (WHERE priority = 3)::INT AS p3,
      count(*) FILTER (WHERE priority = 4)::INT AS p4,
      count(*) FILTER (WHERE priority = 5)::INT AS p5,
      count(*) FILTER (WHERE priority IS NULL)::INT AS p_unassigned,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')::INT AS new_products_7d,
      count(*) FILTER (WHERE scraped_at >= now() - interval '1 hour')::INT AS fresh_1h,
      count(*) FILTER (WHERE scraped_at >= now() - interval '6 hours'
                        AND scraped_at <  now() - interval '1 hour')::INT AS fresh_1h_6h,
      count(*) FILTER (WHERE scraped_at >= now() - interval '24 hours'
                        AND scraped_at <  now() - interval '6 hours')::INT AS fresh_6h_24h,
      count(*) FILTER (WHERE scraped_at >= now() - interval '48 hours'
                        AND scraped_at <  now() - interval '24 hours')::INT AS fresh_24h_48h,
      count(*) FILTER (WHERE scraped_at <  now() - interval '48 hours')::INT AS stale_48h,
      count(*) FILTER (WHERE scraped_at IS NULL)::INT AS never_fresh
    FROM store_products
  ),

  per_store AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'origin_id', sub.origin_id,
        'name', sub.store_name,
        'total', sub.total,
        'available', sub.available,
        'unavailable', sub.unavailable,
        'availability_rate', CASE WHEN sub.total > 0
          THEN round((sub.available::numeric / sub.total) * 100, 1) ELSE 0 END
      ) ORDER BY sub.origin_id
    ) AS data
    FROM (
      SELECT
        sp.origin_id,
        s.name AS store_name,
        count(*)::INT AS total,
        count(*) FILTER (WHERE sp.available = true)::INT AS available,
        count(*) FILTER (WHERE sp.available = false)::INT AS unavailable
      FROM store_products sp
      JOIN supermarkets s ON s.id = sp.origin_id
      WHERE sp.origin_id IS NOT NULL
      GROUP BY sp.origin_id, s.name
    ) sub
  ),

  price_totals AS (
    SELECT
      count(*)::INT AS total_price_points,
      count(*) FILTER (WHERE valid_from >= now() - interval '24 hours')::INT AS new_24h,
      count(*) FILTER (WHERE valid_from >= now() - interval '7 days')::INT AS new_7d
    FROM prices
  ),

  price_changes AS (
    SELECT
      count(*) FILTER (WHERE p_new.price > prev.price)::INT AS increases,
      count(*) FILTER (WHERE p_new.price < prev.price)::INT AS decreases,
      count(*) FILTER (WHERE p_new.price = prev.price)::INT AS unchanged
    FROM prices p_new
    LEFT JOIN LATERAL (
      SELECT price
      FROM prices pp
      WHERE pp.store_product_id = p_new.store_product_id
        AND pp.valid_from < p_new.valid_from
      ORDER BY pp.valid_from DESC
      LIMIT 1
    ) prev ON true
    WHERE p_new.valid_from >= now() - interval '24 hours'
      AND prev.price IS NOT NULL
  ),

  runs_24h AS (
    SELECT
      count(*)::INT AS total_batches,
      coalesce(sum(total), 0)::INT AS total_products,
      coalesce(sum(success), 0)::INT AS total_success,
      coalesce(sum(failed), 0)::INT AS total_failed,
      CASE WHEN count(*) > 0
        THEN round(avg(duration_ms))::INT ELSE 0 END AS avg_duration_ms
    FROM scrape_runs
    WHERE started_at >= now() - interval '24 hours'
  ),

  -- Per-priority health: fresh/stale/unavailable breakdown
  -- Uses same logic as get_schedule_stats RPC for consistency
  priority_health AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'priority', sub.prio,
        'total', sub.total,
        'fresh', sub.fresh,
        'stale_actionable', GREATEST(0, sub.total - sub.unavailable - sub.fresh),
        'unavailable', sub.unavailable,
        'never_scraped', sub.never_scraped,
        'staleness_threshold_hours', sub.threshold_hours,
        'is_active', sub.prio = ANY(ARRAY[5, 4])
      ) ORDER BY sub.prio DESC NULLS LAST
    ) AS data
    FROM (
      SELECT
        sp.priority AS prio,
        count(*)::INT AS total,
        count(*) FILTER (WHERE sp.available = false)::INT AS unavailable,
        count(*) FILTER (WHERE sp.updated_at IS NULL)::INT AS never_scraped,
        count(*) FILTER (
          WHERE sp.available = true
          AND sp.updated_at IS NOT NULL
          AND (
            sp.priority IS NULL
            OR sp.priority = 0
            OR sp.updated_at >= now() - (
              CASE sp.priority
                WHEN 5 THEN 24
                WHEN 4 THEN 48
                WHEN 3 THEN 72
                WHEN 2 THEN 168
                WHEN 1 THEN 336
                ELSE NULL
              END * INTERVAL '1 hour'
            )
          )
        )::INT AS fresh,
        CASE sp.priority
          WHEN 5 THEN 24
          WHEN 4 THEN 48
          WHEN 3 THEN 72
          WHEN 2 THEN 168
          WHEN 1 THEN 336
          ELSE NULL
        END AS threshold_hours
      FROM store_products sp
      GROUP BY sp.priority
    ) sub
  ),

  capacity_calc AS (
    SELECT
      40 AS batch_size,
      20 AS max_batches,
      30 AS cron_freq_min,
      (24 * 60 / 30) AS runs_per_day,
      (40 * 20 * (24 * 60 / 30)) AS available_daily_capacity,
      (
        round(c.p5::numeric / 24 * 24) +
        round(c.p4::numeric / 48 * 24)
      )::INT AS required_daily
    FROM sp_counts c
  )

  SELECT jsonb_build_object(
    'scrape_status', jsonb_build_object(
      'total', c.total,
      'available', c.available,
      'unavailable', c.unavailable,
      'never_scraped', c.never_scraped,
      'availability_rate', CASE WHEN c.total > 0
        THEN round((c.available::numeric / c.total) * 100, 1) ELSE 0 END
    ),
    'per_store', ps.data,
    'scrape_freshness', jsonb_build_object(
      'last_1h', c.fresh_1h,
      'last_1h_to_6h', c.fresh_1h_6h,
      'last_6h_to_24h', c.fresh_6h_24h,
      'last_24h_to_48h', c.fresh_24h_48h,
      'older_48h', c.stale_48h,
      'never', c.never_fresh
    ),
    'scrape_velocity', jsonb_build_object(
      'avg_per_hour_24h', round(c.scraped_24h::numeric / GREATEST(24.0, 1), 1)
    ),
    'price_intelligence', jsonb_build_object(
      'total_price_points', pt.total_price_points,
      'new_prices_24h', pt.new_24h,
      'new_prices_7d', pt.new_7d,
      'increases_24h', pc.increases,
      'decreases_24h', pc.decreases,
      'unchanged_24h', pc.unchanged,
      'products_with_discount', c.with_discount
    ),
    'data_quality', jsonb_build_object(
      'with_barcode', c.with_barcode,
      'barcode_coverage_pct', CASE WHEN c.total > 0
        THEN round((c.with_barcode::numeric / c.total) * 100, 1) ELSE 0 END,
      'with_canonical', c.with_canonical,
      'canonical_match_rate', CASE WHEN c.total > 0
        THEN round((c.with_canonical::numeric / c.total) * 100, 1) ELSE 0 END,
      'with_trade_item', c.with_trade_item,
      'trade_item_coverage', CASE WHEN c.total > 0
        THEN round((c.with_trade_item::numeric / c.total) * 100, 1) ELSE 0 END,
      'with_category', c.with_category,
      'category_coverage_pct', CASE WHEN c.total > 0
        THEN round((c.with_category::numeric / c.total) * 100, 1) ELSE 0 END
    ),
    'priority_distribution', jsonb_build_object(
      'p0', c.p0, 'p1', c.p1, 'p2', c.p2, 'p3', c.p3, 'p4', c.p4, 'p5', c.p5,
      'unassigned', c.p_unassigned
    ),
    'growth', jsonb_build_object(
      'new_products_7d', c.new_products_7d,
      'new_prices_7d', pt.new_7d
    ),
    'scheduler_capacity', jsonb_build_object(
      'status', CASE
        WHEN cap.required_daily > cap.available_daily_capacity THEN 'critical'
        WHEN cap.required_daily > cap.available_daily_capacity * 0.8 THEN 'degraded'
        ELSE 'healthy'
      END,
      'required_daily_scrapes', cap.required_daily,
      'available_daily_capacity', cap.available_daily_capacity,
      'utilization_pct', CASE WHEN cap.available_daily_capacity > 0
        THEN round((cap.required_daily::numeric / cap.available_daily_capacity) * 100, 1) ELSE 0 END,
      'deficit', GREATEST(cap.required_daily - cap.available_daily_capacity, 0),
      'surplus_pct', CASE WHEN cap.required_daily > 0
        THEN round(((cap.available_daily_capacity - cap.required_daily)::numeric / cap.required_daily) * 100, 1) ELSE 0 END,
      'config', jsonb_build_object(
        'batch_size', cap.batch_size,
        'max_batches', cap.max_batches,
        'cron_frequency_minutes', cap.cron_freq_min,
        'runs_per_day', cap.runs_per_day,
        'active_priorities', jsonb_build_array(5, 4)
      )
    ),
    'scrape_runs_24h', jsonb_build_object(
      'total_batches', r24.total_batches,
      'total_products', r24.total_products,
      'total_success', r24.total_success,
      'total_failed', r24.total_failed,
      'success_rate', CASE WHEN r24.total_products > 0
        THEN round((r24.total_success::numeric / r24.total_products) * 100, 1) ELSE 0 END,
      'avg_batch_duration_ms', r24.avg_duration_ms
    ),
    'priority_health', ph.data
  ) INTO v_data
  FROM sp_counts c
  CROSS JOIN per_store ps
  CROSS JOIN price_totals pt
  CROSS JOIN price_changes pc
  CROSS JOIN runs_24h r24
  CROSS JOIN priority_health ph
  CROSS JOIN capacity_calc cap;

  v_dur_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INT;

  INSERT INTO analytics_snapshots (duration_ms, triggered_by, data)
  VALUES (v_dur_ms, p_triggered_by, v_data)
  RETURNING id INTO v_id;

  RETURN v_data || jsonb_build_object('snapshot_id', v_id, 'duration_ms', v_dur_ms);
END;
$$;
