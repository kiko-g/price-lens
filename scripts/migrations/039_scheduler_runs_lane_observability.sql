-- Migration 039: Lane economy observability (ROADMAP Phase 1 §8)
-- scheduler_runs: one row per scheduler cron tick with lane fill stats
-- scrape_runs.lane: per-batch lane tag from batch-worker

CREATE TABLE IF NOT EXISTS scheduler_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  scheduled_total INTEGER NOT NULL DEFAULT 0,
  batches_sent INTEGER NOT NULL DEFAULT 0,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  lane_quotas JSONB NOT NULL,
  lane_fill JSONB NOT NULL,
  by_lane JSONB,
  by_priority JSONB,
  qstash_error TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_scheduler_runs_started_at ON scheduler_runs (started_at DESC);

ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS lane TEXT;

CREATE INDEX IF NOT EXISTS idx_scrape_runs_lane_started ON scrape_runs (lane, started_at DESC)
  WHERE lane IS NOT NULL;

ALTER TABLE scheduler_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON scheduler_runs FOR SELECT
  USING (true);

CREATE POLICY "Anon can insert scheduler runs"
  ON scheduler_runs FOR INSERT
  TO anon
  WITH CHECK (true);

GRANT SELECT, INSERT ON scheduler_runs TO authenticated;
GRANT SELECT, INSERT ON scheduler_runs TO anon;
GRANT USAGE, SELECT ON SEQUENCE scheduler_runs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE scheduler_runs_id_seq TO anon;
