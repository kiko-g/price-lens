-- Migration: Add scheduler capacity, scrape runs, and staleness breakdown to analytics snapshots.
-- Replaces the compute_analytics_snapshot function to include 3 new KPI groups.

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
  -- Single scan of store_products for all count-based metrics
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

  -- NEW: Scrape runs stats from last 24h
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

  -- NEW: Staleness breakdown for active priorities (5, 4 currently active; include all with refresh hours)
  -- Uses priority refresh thresholds: P5=24h, P4=48h, P3=72h, P2=168h, P1=336h
  staleness_raw AS (
    SELECT
      sp.priority,
      CASE
        WHEN sp.scraped_at IS NULL THEN 'never'
        ELSE 'has_time'
      END AS scrape_state,
      CASE
        WHEN sp.scraped_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (now() - sp.scraped_at)) / 3600.0
          - CASE sp.priority
              WHEN 5 THEN 24
              WHEN 4 THEN 48
              WHEN 3 THEN 72
              WHEN 2 THEN 168
              WHEN 1 THEN 336
              ELSE 0
            END
        ELSE NULL
      END AS hours_overdue
    FROM store_products sp
    WHERE sp.priority IN (1, 2, 3, 4, 5)
  ),

  staleness_buckets AS (
    SELECT
      jsonb_build_array(
        jsonb_build_object(
          'label', 'Never scraped',
          'min', null, 'max', null,
          'count', count(*) FILTER (WHERE scrape_state = 'never'),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE scrape_state = 'never' AND priority = 5),
            '4', count(*) FILTER (WHERE scrape_state = 'never' AND priority = 4),
            '3', count(*) FILTER (WHERE scrape_state = 'never' AND priority = 3),
            '2', count(*) FILTER (WHERE scrape_state = 'never' AND priority = 2),
            '1', count(*) FILTER (WHERE scrape_state = 'never' AND priority = 1)
          )
        ),
        jsonb_build_object(
          'label', '0-6 hours overdue',
          'min', 0, 'max', 6,
          'count', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6 AND priority = 5),
            '4', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6 AND priority = 4),
            '3', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6 AND priority = 3),
            '2', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6 AND priority = 2),
            '1', count(*) FILTER (WHERE hours_overdue >= 0 AND hours_overdue < 6 AND priority = 1)
          )
        ),
        jsonb_build_object(
          'label', '6-24 hours overdue',
          'min', 6, 'max', 24,
          'count', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24 AND priority = 5),
            '4', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24 AND priority = 4),
            '3', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24 AND priority = 3),
            '2', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24 AND priority = 2),
            '1', count(*) FILTER (WHERE hours_overdue >= 6 AND hours_overdue < 24 AND priority = 1)
          )
        ),
        jsonb_build_object(
          'label', '1-3 days overdue',
          'min', 24, 'max', 72,
          'count', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72 AND priority = 5),
            '4', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72 AND priority = 4),
            '3', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72 AND priority = 3),
            '2', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72 AND priority = 2),
            '1', count(*) FILTER (WHERE hours_overdue >= 24 AND hours_overdue < 72 AND priority = 1)
          )
        ),
        jsonb_build_object(
          'label', '3-7 days overdue',
          'min', 72, 'max', 168,
          'count', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168 AND priority = 5),
            '4', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168 AND priority = 4),
            '3', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168 AND priority = 3),
            '2', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168 AND priority = 2),
            '1', count(*) FILTER (WHERE hours_overdue >= 72 AND hours_overdue < 168 AND priority = 1)
          )
        ),
        jsonb_build_object(
          'label', '7+ days overdue',
          'min', 168, 'max', null,
          'count', count(*) FILTER (WHERE hours_overdue >= 168),
          'by_priority', jsonb_build_object(
            '5', count(*) FILTER (WHERE hours_overdue >= 168 AND priority = 5),
            '4', count(*) FILTER (WHERE hours_overdue >= 168 AND priority = 4),
            '3', count(*) FILTER (WHERE hours_overdue >= 168 AND priority = 3),
            '2', count(*) FILTER (WHERE hours_overdue >= 168 AND priority = 2),
            '1', count(*) FILTER (WHERE hours_overdue >= 168 AND priority = 1)
          )
        )
      ) AS buckets
    FROM staleness_raw
  ),

  -- NEW: Scheduler capacity calculation
  -- Config: batch_size=40, max_batches=20, cron_frequency=30min
  -- Active priorities: 5, 4 (matches ACTIVE_PRIORITIES in priority.ts)
  -- Refresh hours: P5=24h, P4=48h
  capacity_calc AS (
    SELECT
      40 AS batch_size,
      20 AS max_batches,
      30 AS cron_freq_min,
      (24 * 60 / 30) AS runs_per_day,  -- 48
      (40 * 20 * (24 * 60 / 30)) AS available_daily_capacity,  -- 40*20*48 = 38400
      -- Required: sum(products_at_priority / refresh_hours * 24)
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
    -- NEW KPI groups
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
    'staleness_breakdown', sb.buckets
  ) INTO v_data
  FROM sp_counts c
  CROSS JOIN per_store ps
  CROSS JOIN price_totals pt
  CROSS JOIN price_changes pc
  CROSS JOIN runs_24h r24
  CROSS JOIN staleness_buckets sb
  CROSS JOIN capacity_calc cap;

  v_dur_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INT;

  INSERT INTO analytics_snapshots (duration_ms, triggered_by, data)
  VALUES (v_dur_ms, p_triggered_by, v_data)
  RETURNING id INTO v_id;

  RETURN v_data || jsonb_build_object('snapshot_id', v_id, 'duration_ms', v_dur_ms);
END;
$$;
