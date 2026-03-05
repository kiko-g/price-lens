-- Migration: Precomputed analytics snapshots
-- Replaces live-computed admin overview with a snapshot table refreshed every 12h.
-- Background compute via Vercel cron / QStash; reads are instant.

-- 1. Table
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms   INT,
  triggered_by  TEXT NOT NULL DEFAULT 'cron',
  data          JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_computed_at
  ON analytics_snapshots (computed_at DESC);

-- 2. RLS
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON analytics_snapshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for anon" ON analytics_snapshots
  FOR SELECT TO anon USING (true);

-- 3. Compute function
-- Aggregates KPIs from store_products + prices into a JSONB blob,
-- inserts a new snapshot row, and returns the data.
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
      -- Priority distribution
      count(*) FILTER (WHERE priority = 0)::INT AS p0,
      count(*) FILTER (WHERE priority = 1)::INT AS p1,
      count(*) FILTER (WHERE priority = 2)::INT AS p2,
      count(*) FILTER (WHERE priority = 3)::INT AS p3,
      count(*) FILTER (WHERE priority = 4)::INT AS p4,
      count(*) FILTER (WHERE priority = 5)::INT AS p5,
      count(*) FILTER (WHERE priority IS NULL)::INT AS p_unassigned,
      -- Growth
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')::INT AS new_products_7d,
      -- Scrape freshness (exclusive bands)
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

  -- Per-store breakdown (needs GROUP BY, separate scan)
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

  -- Price totals from prices table
  price_totals AS (
    SELECT
      count(*)::INT AS total_price_points,
      count(*) FILTER (WHERE valid_from >= now() - interval '24 hours')::INT AS new_24h,
      count(*) FILTER (WHERE valid_from >= now() - interval '7 days')::INT AS new_7d
    FROM prices
  ),

  -- Price direction changes in last 24h (LATERAL lookup for previous price)
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
    )
  ) INTO v_data
  FROM sp_counts c
  CROSS JOIN per_store ps
  CROSS JOIN price_totals pt
  CROSS JOIN price_changes pc;

  v_dur_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INT;

  INSERT INTO analytics_snapshots (duration_ms, triggered_by, data)
  VALUES (v_dur_ms, p_triggered_by, v_data)
  RETURNING id INTO v_id;

  RETURN v_data || jsonb_build_object('snapshot_id', v_id, 'duration_ms', v_dur_ms);
END;
$$;

-- 4. Permissions
GRANT EXECUTE ON FUNCTION compute_analytics_snapshot(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_analytics_snapshot(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION compute_analytics_snapshot(TEXT) TO service_role;
