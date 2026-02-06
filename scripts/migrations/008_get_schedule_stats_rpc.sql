-- Migration: Create get_schedule_stats RPC function
-- This replaces 28-35 sequential queries with a single aggregated query
-- Expected performance improvement: 4+ seconds -> ~300ms

CREATE OR REPLACE FUNCTION get_schedule_stats(
  priority_refresh_hours JSONB DEFAULT '{
    "5": 4,
    "4": 12,
    "3": 24,
    "2": 72,
    "1": 168,
    "0": null
  }'::jsonb
)
RETURNS TABLE (
  priority INTEGER,
  total BIGINT,
  unavailable BIGINT,
  never_scraped BIGINT,
  fresh BIGINT,
  stale_actionable BIGINT,
  staleness_threshold_hours DOUBLE PRECISION
) 
LANGUAGE plpgsql
AS $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  WITH priority_config AS (
    -- Generate priority levels with their thresholds
    SELECT 
      p.priority_val,
      CASE 
        WHEN p.priority_val IS NULL THEN NULL
        WHEN priority_refresh_hours ? p.priority_val::text THEN 
          (priority_refresh_hours ->> p.priority_val::text)::double precision
        ELSE NULL
      END as threshold_hours
    FROM (
      SELECT unnest(ARRAY[5, 4, 3, 2, 1, 0, NULL::integer]) as priority_val
    ) p
  ),
  stats AS (
    SELECT 
      sp.priority as prio,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE sp.available = false) as unavailable_count,
      COUNT(*) FILTER (WHERE sp.updated_at IS NULL) as never_scraped_count,
      -- Fresh: available AND updated_at >= cutoff (if threshold exists)
      -- For priorities without threshold, fresh = all available that have been scraped
      COUNT(*) FILTER (
        WHERE sp.available = true 
        AND sp.updated_at IS NOT NULL
        AND (
          -- No threshold configured: all scraped available are fresh
          NOT (priority_refresh_hours ? COALESCE(sp.priority::text, 'null'))
          OR (priority_refresh_hours ->> COALESCE(sp.priority::text, 'null')) IS NULL
          -- Has threshold: check if within threshold
          OR sp.updated_at >= now_ts - (
            (priority_refresh_hours ->> sp.priority::text)::double precision * INTERVAL '1 hour'
          )
        )
      ) as fresh_count
    FROM store_products sp
    GROUP BY sp.priority
  )
  SELECT 
    pc.priority_val as priority,
    COALESCE(s.total_count, 0) as total,
    COALESCE(s.unavailable_count, 0) as unavailable,
    COALESCE(s.never_scraped_count, 0) as never_scraped,
    COALESCE(s.fresh_count, 0) as fresh,
    -- Stale actionable = (total - unavailable) - fresh = available - fresh
    GREATEST(0, COALESCE(s.total_count, 0) - COALESCE(s.unavailable_count, 0) - COALESCE(s.fresh_count, 0)) as stale_actionable,
    pc.threshold_hours as staleness_threshold_hours
  FROM priority_config pc
  LEFT JOIN stats s ON (pc.priority_val IS NOT DISTINCT FROM s.prio)
  ORDER BY pc.priority_val DESC NULLS LAST;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_schedule_stats(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_schedule_stats(JSONB) TO anon;

-- Test the function (optional, comment out for production)
-- SELECT * FROM get_schedule_stats();
