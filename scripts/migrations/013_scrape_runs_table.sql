-- Migration: Create scrape_runs table for persistent batch tracking
-- Tracks every batch-worker execution to diagnose throughput issues

CREATE TABLE IF NOT EXISTS scrape_runs (
  id BIGSERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER,
  error TEXT
);

-- Index for querying recent runs
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started_at ON scrape_runs (started_at DESC);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON scrape_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON scrape_runs TO anon;
GRANT USAGE, SELECT ON SEQUENCE scrape_runs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE scrape_runs_id_seq TO anon;
