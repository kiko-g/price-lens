-- Data Health Cockpit: daily snapshot table + compute RPC (ROADMAP §7 SLOs)

CREATE TABLE IF NOT EXISTS data_health_snapshots (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms   INT,
  triggered_by  TEXT NOT NULL DEFAULT 'cron',
  data          JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_health_snapshots_computed_at
  ON data_health_snapshots (computed_at DESC);

ALTER TABLE data_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON data_health_snapshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for anon" ON data_health_snapshots
  FOR SELECT TO anon USING (true);

CREATE OR REPLACE FUNCTION compute_data_health_snapshot(p_triggered_by TEXT DEFAULT 'cron')
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
      count(*) FILTER (WHERE available = true AND priority = 5
                        AND scraped_at >= now() - interval '48 hours')::INT AS p5_fresh_48h,
      count(*) FILTER (WHERE available = true AND priority = 5)::INT AS p5_available,
      count(*) FILTER (WHERE available = true AND priority = 4
                        AND scraped_at >= now() - interval '48 hours')::INT AS p4_fresh_48h,
      count(*) FILTER (WHERE available = true AND priority = 4)::INT AS p4_available,
      count(*) FILTER (WHERE available = true AND priority = 3
                        AND scraped_at >= now() - interval '72 hours')::INT AS p3_fresh_72h,
      count(*) FILTER (WHERE available = true AND priority = 3)::INT AS p3_available,
      count(*) FILTER (WHERE available = true AND priority = 2
                        AND scraped_at >= now() - interval '168 hours')::INT AS p2_fresh_7d,
      count(*) FILTER (WHERE available = true AND priority = 2)::INT AS p2_available,
      count(*) FILTER (WHERE available = true AND priority = 1
                        AND scraped_at >= now() - interval '336 hours')::INT AS p1_fresh_14d,
      count(*) FILTER (WHERE available = true AND priority = 1)::INT AS p1_available,
      count(*) FILTER (WHERE available = true AND priority = 1
                        AND scraped_at >= now() - interval '7 days')::INT AS p1_scraped_7d,
      count(*) FILTER (WHERE available = true
                        AND (scraped_at IS NULL OR scraped_at < now() - interval '30 days'))::INT AS available_unscraped_30d,
      count(*) FILTER (WHERE available = false)::INT AS zombie_total,
      count(*) FILTER (WHERE available = false
                        AND scraped_at < now() - interval '30 days')::INT AS zombie_stale_30d,
      count(*) FILTER (WHERE available = false
                        AND scraped_at < now() - interval '45 days')::INT AS zombie_stale_45d,
      count(*) FILTER (WHERE available = false AND last_http_status = 200)::INT AS false_zombie,
      count(*) FILTER (WHERE available = false AND barcode IS NULL)::INT AS zombie_no_barcode,
      count(*) FILTER (WHERE priority IS NULL AND name IS NULL)::INT AS skeleton_total,
      count(*) FILTER (WHERE priority_source = 'unmapped')::INT AS parked,
      count(*) FILTER (WHERE available = true AND price_stats_updated_at IS NOT NULL)::INT AS with_volatility_stats,
      count(*) FILTER (WHERE priority_updated_at >= now() - interval '24 hours'
                        AND priority_source IN ('category_default', 'unmapped'))::INT AS triage_24h,
      count(*) FILTER (WHERE priority_updated_at >= now() - interval '7 days'
                        AND priority_source IN ('category_default', 'unmapped'))::INT AS triage_7d,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days'
                        AND priority IS NULL AND name IS NULL)::INT AS skeleton_intake_7d
    FROM store_products
  ),

  vetoed_total AS (
    SELECT count(*)::INT AS vetoed FROM vetoed_store_skus
  ),

  lane_fill_48h AS (
    SELECT
      coalesce(sum((lane_fill->'sla'->>'requested')::INT), 0)::INT AS sla_requested,
      coalesce(sum((lane_fill->'sla'->>'filled')::INT), 0)::INT AS sla_filled,
      coalesce(sum((lane_fill->'sla'->>'backlog')::INT), 0)::INT AS sla_backlog_sum,
      coalesce(sum((lane_fill->'healing'->>'requested')::INT), 0)::INT AS healing_requested,
      coalesce(sum((lane_fill->'healing'->>'filled')::INT), 0)::INT AS healing_filled,
      coalesce(sum((lane_fill->'healing'->>'backlog')::INT), 0)::INT AS healing_backlog_sum,
      coalesce(sum((lane_fill->'long_tail'->>'requested')::INT), 0)::INT AS long_tail_requested,
      coalesce(sum((lane_fill->'long_tail'->>'filled')::INT), 0)::INT AS long_tail_filled,
      coalesce(sum((lane_fill->'long_tail'->>'backlog')::INT), 0)::INT AS long_tail_backlog_sum,
      count(*)::INT AS scheduler_runs
    FROM scheduler_runs
    WHERE started_at >= now() - interval '48 hours'
      AND dry_run = false
  ),

  lane_fill_7d AS (
    SELECT
      coalesce(sum((lane_fill->'sla'->>'requested')::INT), 0)::INT AS sla_requested,
      coalesce(sum((lane_fill->'sla'->>'filled')::INT), 0)::INT AS sla_filled,
      coalesce(sum((lane_fill->'healing'->>'requested')::INT), 0)::INT AS healing_requested,
      coalesce(sum((lane_fill->'healing'->>'filled')::INT), 0)::INT AS healing_filled,
      coalesce(sum((lane_fill->'long_tail'->>'requested')::INT), 0)::INT AS long_tail_requested,
      coalesce(sum((lane_fill->'long_tail'->>'filled')::INT), 0)::INT AS long_tail_filled,
      count(*)::INT AS scheduler_runs
    FROM scheduler_runs
    WHERE started_at >= now() - interval '7 days'
      AND dry_run = false
  ),

  scrape_by_lane_48h AS (
    SELECT
      coalesce(sum(total) FILTER (WHERE lane = 'sla'), 0)::INT AS sla_total,
      coalesce(sum(success) FILTER (WHERE lane = 'sla'), 0)::INT AS sla_success,
      coalesce(sum(failed) FILTER (WHERE lane = 'sla'), 0)::INT AS sla_failed,
      coalesce(sum(total) FILTER (WHERE lane = 'healing'), 0)::INT AS healing_total,
      coalesce(sum(success) FILTER (WHERE lane = 'healing'), 0)::INT AS healing_success,
      coalesce(sum(failed) FILTER (WHERE lane = 'healing'), 0)::INT AS healing_failed,
      coalesce(sum(total) FILTER (WHERE lane = 'long_tail'), 0)::INT AS long_tail_total,
      coalesce(sum(success) FILTER (WHERE lane = 'long_tail'), 0)::INT AS long_tail_success,
      coalesce(sum(failed) FILTER (WHERE lane = 'long_tail'), 0)::INT AS long_tail_failed
    FROM scrape_runs
    WHERE started_at >= now() - interval '48 hours'
  ),

  scrape_by_lane_7d AS (
    SELECT
      coalesce(sum(total) FILTER (WHERE lane = 'sla'), 0)::INT AS sla_total,
      coalesce(sum(success) FILTER (WHERE lane = 'sla'), 0)::INT AS sla_success,
      coalesce(sum(total) FILTER (WHERE lane = 'healing'), 0)::INT AS healing_total,
      coalesce(sum(success) FILTER (WHERE lane = 'healing'), 0)::INT AS healing_success,
      coalesce(sum(total) FILTER (WHERE lane = 'long_tail'), 0)::INT AS long_tail_total,
      coalesce(sum(success) FILTER (WHERE lane = 'long_tail'), 0)::INT AS long_tail_success
    FROM scrape_runs
    WHERE started_at >= now() - interval '7 days'
  ),

  discovery_stats AS (
    SELECT
      coalesce(jsonb_agg(
        jsonb_build_object(
          'origin_id', sub.origin_id,
          'runs_30d', sub.runs_30d,
          'last_run_at', sub.last_run_at,
          'urls_new_30d', sub.urls_new_30d
        ) ORDER BY sub.origin_id
      ), '[]'::jsonb) AS per_origin,
      coalesce(min(sub.runs_30d), 0)::INT AS min_runs_30d_per_store
    FROM (
      SELECT
        dr.origin_id,
        count(*) FILTER (WHERE dr.started_at >= now() - interval '30 days')::INT AS runs_30d,
        max(dr.started_at) AS last_run_at,
        coalesce(sum(dr.urls_new) FILTER (WHERE dr.started_at >= now() - interval '30 days'), 0)::INT AS urls_new_30d
      FROM discovery_runs dr
      GROUP BY dr.origin_id
    ) sub
  ),

  discovery_7d AS (
    SELECT
      coalesce(sum(urls_new), 0)::INT AS urls_new_7d,
      coalesce(sum(urls_found), 0)::INT AS urls_found_7d,
      count(*)::INT AS runs_7d
    FROM discovery_runs
    WHERE started_at >= now() - interval '7 days'
  ),

  weekly_prices AS (
    SELECT coalesce(jsonb_agg(
      jsonb_build_object('week', w.week, 'count', w.cnt) ORDER BY w.week
    ), '[]'::jsonb) AS weeks
    FROM (
      SELECT date_trunc('week', created_at)::date AS week, count(*)::INT AS cnt
      FROM prices
      WHERE created_at > now() - interval '120 days'
      GROUP BY 1
    ) w
  ),

  weekly_price_current AS (
    SELECT
      coalesce(cnt, 0)::INT AS current_week_count,
      coalesce(prev_cnt, 0)::INT AS prev_week_count
    FROM (
      SELECT count(*)::INT AS cnt
      FROM prices
      WHERE created_at >= date_trunc('week', now())
    ) cur
    CROSS JOIN (
      SELECT count(*)::INT AS prev_cnt
      FROM prices
      WHERE created_at >= date_trunc('week', now()) - interval '7 days'
        AND created_at < date_trunc('week', now())
    ) prev
  ),

  db_size AS (
    SELECT pg_database_size(current_database())::BIGINT AS size_bytes
  ),

  volatility_meta AS (
    SELECT max(price_stats_updated_at) AS last_update
    FROM store_products
    WHERE price_stats_updated_at IS NOT NULL
  ),

  slo_values AS (
    SELECT
      c.*,
      vt.vetoed,
      CASE WHEN c.p5_available > 0
        THEN round((c.p5_fresh_48h::numeric / c.p5_available) * 100, 1) ELSE 0 END AS p5_fresh_pct,
      CASE WHEN c.available > 0
        THEN round((c.with_volatility_stats::numeric / c.available) * 100, 1) ELSE 0 END AS volatility_pct,
      CASE WHEN c.p1_available > 0 AND c.p1_scraped_7d > 0
        THEN round((c.p1_available::numeric / c.p1_scraped_7d) * 7, 1)
        ELSE NULL END AS p1_rotation_days,
      CASE WHEN c.zombie_total > 0
        THEN round((c.zombie_no_barcode::numeric / c.zombie_total) * 100, 1) ELSE 0 END AS zombie_no_barcode_pct,
      ds.min_runs_30d_per_store,
      d7.urls_new_7d AS discovery_urls_new_7d,
      d7.runs_7d AS discovery_runs_7d,
      wpc.current_week_count,
      wpc.prev_week_count,
      db.size_bytes,
      vm.last_update AS volatility_last_update
    FROM sp_counts c
    CROSS JOIN vetoed_total vt
    CROSS JOIN discovery_stats ds
    CROSS JOIN discovery_7d d7
    CROSS JOIN weekly_price_current wpc
    CROSS JOIN db_size db
    CROSS JOIN volatility_meta vm
  )

  SELECT jsonb_build_object(
    'slos', jsonb_build_array(
      jsonb_build_object(
        'key', 'p5_fresh_48h',
        'label', 'P5 frescos < 48h',
        'value', sv.p5_fresh_pct,
        'target', 95,
        'unit', '%',
        'direction', 'higher_better',
        'status', CASE
          WHEN sv.p5_available = 0 THEN 'warn'
          WHEN sv.p5_fresh_pct >= 95 THEN 'ok'
          WHEN sv.p5_fresh_pct >= 85 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'available_unscraped_30d',
        'label', 'Disponíveis sem scrape > 30d',
        'value', sv.available_unscraped_30d,
        'target', 1000,
        'unit', 'count',
        'direction', 'lower_better',
        'status', CASE
          WHEN sv.available_unscraped_30d < 1000 THEN 'ok'
          WHEN sv.available_unscraped_30d < 5000 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'zombies_unrechecked_45d',
        'label', 'Zombies sem reverificação > 45d',
        'value', sv.zombie_stale_45d,
        'target', 0,
        'unit', 'count',
        'direction', 'lower_better',
        'status', CASE
          WHEN sv.zombie_stale_45d < 1000 THEN 'ok'
          WHEN sv.zombie_stale_45d < 10000 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'volatility_stats',
        'label', 'Produtos com estatísticas de volatilidade',
        'value', sv.volatility_pct,
        'target', 95,
        'unit', '%',
        'direction', 'higher_better',
        'status', CASE
          WHEN sv.volatility_pct >= 95 THEN 'ok'
          WHEN sv.volatility_pct >= 80 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'p1_rotation_days',
        'label', 'Rotação completa P1',
        'value', coalesce(sv.p1_rotation_days, 999),
        'target', 14,
        'unit', 'days',
        'direction', 'lower_better',
        'status', CASE
          WHEN sv.p1_rotation_days IS NULL OR sv.p1_rotation_days > 90 THEN 'breach'
          WHEN sv.p1_rotation_days <= 14 THEN 'ok'
          WHEN sv.p1_rotation_days <= 30 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'discovery_runs_month',
        'label', 'Execuções discovery / loja (30d)',
        'value', sv.min_runs_30d_per_store,
        'target', 4,
        'unit', 'count',
        'direction', 'higher_better',
        'status', CASE
          WHEN sv.min_runs_30d_per_store >= 4 THEN 'ok'
          WHEN sv.min_runs_30d_per_store >= 2 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'db_size_mb',
        'label', 'Tamanho da base de dados',
        'value', round(sv.size_bytes::numeric / (1024 * 1024), 1),
        'target', 320,
        'unit', 'MB',
        'direction', 'lower_better',
        'status', CASE
          WHEN sv.size_bytes < 320 * 1024 * 1024 THEN 'ok'
          WHEN sv.size_bytes < 400 * 1024 * 1024 THEN 'warn'
          ELSE 'breach' END
      ),
      jsonb_build_object(
        'key', 'weekly_price_rows',
        'label', 'Preços registados (semana atual)',
        'value', sv.current_week_count,
        'target', 15000,
        'unit', 'count',
        'direction', 'higher_better',
        'status', CASE
          WHEN sv.current_week_count >= 15000 THEN 'ok'
          WHEN sv.current_week_count >= 10000 OR sv.current_week_count > sv.prev_week_count THEN 'warn'
          ELSE 'breach' END
      )
    ),
    'freshness', jsonb_build_object(
      'by_priority', jsonb_build_array(
        jsonb_build_object('priority', 5, 'fresh', sv.p5_fresh_48h, 'total', sv.p5_available,
          'fresh_pct', CASE WHEN sv.p5_available > 0 THEN round((sv.p5_fresh_48h::numeric / sv.p5_available) * 100, 1) ELSE 0 END,
          'threshold_hours', 48),
        jsonb_build_object('priority', 4, 'fresh', sv.p4_fresh_48h, 'total', sv.p4_available,
          'fresh_pct', CASE WHEN sv.p4_available > 0 THEN round((sv.p4_fresh_48h::numeric / sv.p4_available) * 100, 1) ELSE 0 END,
          'threshold_hours', 48),
        jsonb_build_object('priority', 3, 'fresh', sv.p3_fresh_72h, 'total', sv.p3_available,
          'fresh_pct', CASE WHEN sv.p3_available > 0 THEN round((sv.p3_fresh_72h::numeric / sv.p3_available) * 100, 1) ELSE 0 END,
          'threshold_hours', 72),
        jsonb_build_object('priority', 2, 'fresh', sv.p2_fresh_7d, 'total', sv.p2_available,
          'fresh_pct', CASE WHEN sv.p2_available > 0 THEN round((sv.p2_fresh_7d::numeric / sv.p2_available) * 100, 1) ELSE 0 END,
          'threshold_hours', 168),
        jsonb_build_object('priority', 1, 'fresh', sv.p1_fresh_14d, 'total', sv.p1_available,
          'fresh_pct', CASE WHEN sv.p1_available > 0 THEN round((sv.p1_fresh_14d::numeric / sv.p1_available) * 100, 1) ELSE 0 END,
          'threshold_hours', 336)
      )
    ),
    'backlog', jsonb_build_object(
      'skeleton_total', sv.skeleton_total,
      'untriaged', sv.skeleton_total,
      'parked', sv.parked,
      'vetoed', sv.vetoed,
      'triage_24h', sv.triage_24h,
      'triage_7d', sv.triage_7d,
      'skeleton_intake_7d', sv.skeleton_intake_7d,
      'net_skeleton_pressure', sv.skeleton_intake_7d - sv.triage_7d
    ),
    'lanes', jsonb_build_object(
      'h48', jsonb_build_object(
        'scheduler_runs', lf48.scheduler_runs,
        'sla', jsonb_build_object(
          'requested', lf48.sla_requested, 'filled', lf48.sla_filled,
          'fill_pct', CASE WHEN lf48.sla_requested > 0 THEN round((lf48.sla_filled::numeric / lf48.sla_requested) * 100, 1) ELSE 0 END,
          'backlog_sum', lf48.sla_backlog_sum
        ),
        'healing', jsonb_build_object(
          'requested', lf48.healing_requested, 'filled', lf48.healing_filled,
          'fill_pct', CASE WHEN lf48.healing_requested > 0 THEN round((lf48.healing_filled::numeric / lf48.healing_requested) * 100, 1) ELSE 0 END,
          'backlog_sum', lf48.healing_backlog_sum
        ),
        'long_tail', jsonb_build_object(
          'requested', lf48.long_tail_requested, 'filled', lf48.long_tail_filled,
          'fill_pct', CASE WHEN lf48.long_tail_requested > 0 THEN round((lf48.long_tail_filled::numeric / lf48.long_tail_requested) * 100, 1) ELSE 0 END,
          'backlog_sum', lf48.long_tail_backlog_sum
        ),
        'scrape_runs', jsonb_build_object(
          'sla', jsonb_build_object('total', s48.sla_total, 'success', s48.sla_success, 'failed', s48.sla_failed,
            'success_rate', CASE WHEN s48.sla_total > 0 THEN round((s48.sla_success::numeric / s48.sla_total) * 100, 1) ELSE 0 END),
          'healing', jsonb_build_object('total', s48.healing_total, 'success', s48.healing_success, 'failed', s48.healing_failed,
            'success_rate', CASE WHEN s48.healing_total > 0 THEN round((s48.healing_success::numeric / s48.healing_total) * 100, 1) ELSE 0 END),
          'long_tail', jsonb_build_object('total', s48.long_tail_total, 'success', s48.long_tail_success, 'failed', s48.long_tail_failed,
            'success_rate', CASE WHEN s48.long_tail_total > 0 THEN round((s48.long_tail_success::numeric / s48.long_tail_total) * 100, 1) ELSE 0 END)
        )
      ),
      'd7', jsonb_build_object(
        'scheduler_runs', lf7.scheduler_runs,
        'sla', jsonb_build_object('requested', lf7.sla_requested, 'filled', lf7.sla_filled,
          'fill_pct', CASE WHEN lf7.sla_requested > 0 THEN round((lf7.sla_filled::numeric / lf7.sla_requested) * 100, 1) ELSE 0 END),
        'healing', jsonb_build_object('requested', lf7.healing_requested, 'filled', lf7.healing_filled,
          'fill_pct', CASE WHEN lf7.healing_requested > 0 THEN round((lf7.healing_filled::numeric / lf7.healing_requested) * 100, 1) ELSE 0 END),
        'long_tail', jsonb_build_object('requested', lf7.long_tail_requested, 'filled', lf7.long_tail_filled,
          'fill_pct', CASE WHEN lf7.long_tail_requested > 0 THEN round((lf7.long_tail_filled::numeric / lf7.long_tail_requested) * 100, 1) ELSE 0 END),
        'scrape_runs', jsonb_build_object(
          'sla', jsonb_build_object('total', s7.sla_total, 'success', s7.sla_success,
            'success_rate', CASE WHEN s7.sla_total > 0 THEN round((s7.sla_success::numeric / s7.sla_total) * 100, 1) ELSE 0 END),
          'healing', jsonb_build_object('total', s7.healing_total, 'success', s7.healing_success,
            'success_rate', CASE WHEN s7.healing_total > 0 THEN round((s7.healing_success::numeric / s7.healing_total) * 100, 1) ELSE 0 END),
          'long_tail', jsonb_build_object('total', s7.long_tail_total, 'success', s7.long_tail_success,
            'success_rate', CASE WHEN s7.long_tail_total > 0 THEN round((s7.long_tail_success::numeric / s7.long_tail_total) * 100, 1) ELSE 0 END)
        )
      )
    ),
    'zombies', jsonb_build_object(
      'unavailable_total', sv.zombie_total,
      'stale_30d', sv.zombie_stale_30d,
      'stale_45d', sv.zombie_stale_45d,
      'false_zombie', sv.false_zombie,
      'no_barcode_pct', sv.zombie_no_barcode_pct
    ),
    'volatility', jsonb_build_object(
      'with_stats_pct', sv.volatility_pct,
      'with_stats_count', sv.with_volatility_stats,
      'available_total', sv.available,
      'last_update', sv.volatility_last_update
    ),
    'discovery', jsonb_build_object(
      'per_origin', ds.per_origin,
      'urls_new_7d', sv.discovery_urls_new_7d,
      'runs_7d', sv.discovery_runs_7d
    ),
    'pipeline', jsonb_build_object(
      'discovery_urls_new_7d', sv.discovery_urls_new_7d,
      'triage_7d', sv.triage_7d,
      'skeleton_total', sv.skeleton_total,
      'lane_scheduled_48h', lf48.sla_filled + lf48.healing_filled + lf48.long_tail_filled,
      'scrape_success_48h', s48.sla_success + s48.healing_success + s48.long_tail_success
    ),
    'db', jsonb_build_object(
      'size_bytes', sv.size_bytes,
      'size_mb', round(sv.size_bytes::numeric / (1024 * 1024), 1),
      'weekly_price_rows', wp.weeks,
      'current_week_price_rows', sv.current_week_count,
      'prev_week_price_rows', sv.prev_week_count,
      'p1_rotation_days', sv.p1_rotation_days
    )
  ) INTO v_data
  FROM slo_values sv
  CROSS JOIN lane_fill_48h lf48
  CROSS JOIN lane_fill_7d lf7
  CROSS JOIN scrape_by_lane_48h s48
  CROSS JOIN scrape_by_lane_7d s7
  CROSS JOIN discovery_stats ds
  CROSS JOIN weekly_prices wp;

  v_dur_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INT;

  INSERT INTO data_health_snapshots (duration_ms, triggered_by, data)
  VALUES (v_dur_ms, p_triggered_by, v_data)
  RETURNING id INTO v_id;

  RETURN v_data || jsonb_build_object('snapshot_id', v_id, 'duration_ms', v_dur_ms);
END;
$$;

-- Read-only successor suggestions (v0 heuristic for admin review)
CREATE OR REPLACE FUNCTION suggest_product_successors(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  FROM (
    SELECT
      old.id AS predecessor_id,
      old.name AS predecessor_name,
      old.barcode AS predecessor_barcode,
      new.id AS successor_id,
      new.name AS successor_name,
      new.barcode AS successor_barcode,
      old.origin_id,
      old.brand,
      old.category,
      CASE
        WHEN old.barcode IS NOT NULL AND new.barcode IS NOT NULL THEN 'medium'
        ELSE 'low'
      END AS confidence
    FROM store_products old
    JOIN store_products new ON
      old.origin_id = new.origin_id
      AND old.brand = new.brand
      AND old.category = new.category
      AND old.id <> new.id
      AND old.brand IS NOT NULL
      AND old.category IS NOT NULL
    WHERE old.available = false
      AND new.available = true
      AND new.created_at >= now() - interval '90 days'
      AND old.scraped_at < now() - interval '30 days'
      AND (old.barcode IS DISTINCT FROM new.barcode)
    ORDER BY old.scraped_at ASC
    LIMIT p_limit
  ) sub;
$$;
