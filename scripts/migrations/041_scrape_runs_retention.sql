-- Phase 3: scrape_runs retention — keep 60d raw, daily rollup for older rows.
-- Est. ~12–15MB recovery + caps row growth (~700/day).

CREATE TABLE IF NOT EXISTS scrape_runs_daily (
  run_day         DATE NOT NULL,
  lane            TEXT NOT NULL DEFAULT 'unknown',
  batch_count     INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  success         INTEGER NOT NULL DEFAULT 0,
  failed          INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER,
  rolled_up_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_day, lane)
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_daily_run_day
  ON scrape_runs_daily (run_day DESC);

ALTER TABLE scrape_runs_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read scrape_runs_daily"
  ON scrape_runs_daily FOR SELECT
  USING (true);

GRANT SELECT ON scrape_runs_daily TO authenticated;
GRANT SELECT ON scrape_runs_daily TO anon;

-- Rolls up and deletes raw scrape_runs older than p_keep_days.
-- Processes at most p_max_days calendar day(s) per call to stay within statement_timeout.
CREATE OR REPLACE FUNCTION rollup_scrape_runs_retention(
  p_keep_days INT DEFAULT 60,
  p_max_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '120s'
AS $$
DECLARE
  v_cutoff        TIMESTAMPTZ;
  v_day           DATE;
  v_days_done     INT := 0;
  v_lanes_upserted INT := 0;
  v_rows_deleted  INT := 0;
  v_day_deleted   INT;
  v_day_lanes     INT;
  v_remaining     BIGINT;
BEGIN
  v_cutoff := now() - (p_keep_days || ' days')::interval;

  FOR v_day IN
    SELECT DISTINCT (started_at AT TIME ZONE 'UTC')::date AS d
    FROM scrape_runs
    WHERE started_at < v_cutoff
    ORDER BY 1
    LIMIT GREATEST(p_max_days, 1)
  LOOP
    WITH aggregated AS (
      SELECT
        (started_at AT TIME ZONE 'UTC')::date AS run_day,
        coalesce(lane, 'unknown') AS lane,
        count(*)::INT AS batch_count,
        coalesce(sum(total), 0)::INT AS total,
        coalesce(sum(success), 0)::INT AS success,
        coalesce(sum(failed), 0)::INT AS failed,
        CASE WHEN count(*) > 0
          THEN round(avg(duration_ms))::INT
          ELSE NULL
        END AS avg_duration_ms
      FROM scrape_runs
      WHERE started_at >= v_day::timestamptz
        AND started_at < (v_day + 1)::timestamptz
        AND started_at < v_cutoff
      GROUP BY 1, 2
    ),
    upserted AS (
      INSERT INTO scrape_runs_daily (run_day, lane, batch_count, total, success, failed, avg_duration_ms, rolled_up_at)
      SELECT run_day, lane, batch_count, total, success, failed, avg_duration_ms, now()
      FROM aggregated
      ON CONFLICT (run_day, lane) DO UPDATE SET
        batch_count     = scrape_runs_daily.batch_count + EXCLUDED.batch_count,
        total           = scrape_runs_daily.total + EXCLUDED.total,
        success         = scrape_runs_daily.success + EXCLUDED.success,
        failed          = scrape_runs_daily.failed + EXCLUDED.failed,
        avg_duration_ms = CASE
          WHEN scrape_runs_daily.batch_count + EXCLUDED.batch_count > 0
          THEN round(
            (coalesce(scrape_runs_daily.avg_duration_ms, 0)::numeric * scrape_runs_daily.batch_count
             + coalesce(EXCLUDED.avg_duration_ms, 0)::numeric * EXCLUDED.batch_count)
            / (scrape_runs_daily.batch_count + EXCLUDED.batch_count)
          )::INT
          ELSE NULL
        END,
        rolled_up_at = now()
      RETURNING 1
    )
    SELECT count(*)::INT FROM upserted INTO v_day_lanes;
    v_lanes_upserted := v_lanes_upserted + v_day_lanes;

    DELETE FROM scrape_runs
    WHERE started_at >= v_day::timestamptz
      AND started_at < (v_day + 1)::timestamptz
      AND started_at < v_cutoff;

    GET DIAGNOSTICS v_day_deleted = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_day_deleted;
    v_days_done := v_days_done + 1;
  END LOOP;

  SELECT count(*) INTO v_remaining
  FROM scrape_runs
  WHERE started_at < v_cutoff;

  RETURN jsonb_build_object(
    'keep_days', p_keep_days,
    'cutoff', v_cutoff,
    'days_processed', v_days_done,
    'lanes_upserted', v_lanes_upserted,
    'rows_deleted', v_rows_deleted,
    'remaining_old_rows', v_remaining
  );
END;
$$;
