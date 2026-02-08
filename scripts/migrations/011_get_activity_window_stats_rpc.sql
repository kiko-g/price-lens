-- Migration: Create get_activity_window_stats RPC function
-- Replaces 4 separate queries (one per time window) that each fetch all rows
-- and are silently capped at 1000 by Supabase's default row limit.
-- This single query returns aggregated counts by priority for each window.

CREATE OR REPLACE FUNCTION get_activity_window_stats()
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'windows', json_build_array(
      json_build_object(
        'label', 'Last 30 minutes',
        'byPriority', (
          SELECT COALESCE(json_object_agg(priority, cnt), '{}'::json)
          FROM (
            SELECT COALESCE(priority, -1) as priority, count(*) as cnt
            FROM store_products
            WHERE updated_at >= now() - interval '30 minutes'
            GROUP BY priority
          ) sub
        ),
        'total', (SELECT count(*) FROM store_products WHERE updated_at >= now() - interval '30 minutes')
      ),
      json_build_object(
        'label', 'Last hour',
        'byPriority', (
          SELECT COALESCE(json_object_agg(priority, cnt), '{}'::json)
          FROM (
            SELECT COALESCE(priority, -1) as priority, count(*) as cnt
            FROM store_products
            WHERE updated_at >= now() - interval '1 hour'
            GROUP BY priority
          ) sub
        ),
        'total', (SELECT count(*) FROM store_products WHERE updated_at >= now() - interval '1 hour')
      ),
      json_build_object(
        'label', 'Last 6 hours',
        'byPriority', (
          SELECT COALESCE(json_object_agg(priority, cnt), '{}'::json)
          FROM (
            SELECT COALESCE(priority, -1) as priority, count(*) as cnt
            FROM store_products
            WHERE updated_at >= now() - interval '6 hours'
            GROUP BY priority
          ) sub
        ),
        'total', (SELECT count(*) FROM store_products WHERE updated_at >= now() - interval '6 hours')
      ),
      json_build_object(
        'label', 'Last 24 hours',
        'byPriority', (
          SELECT COALESCE(json_object_agg(priority, cnt), '{}'::json)
          FROM (
            SELECT COALESCE(priority, -1) as priority, count(*) as cnt
            FROM store_products
            WHERE updated_at >= now() - interval '24 hours'
            GROUP BY priority
          ) sub
        ),
        'total', (SELECT count(*) FROM store_products WHERE updated_at >= now() - interval '24 hours')
      )
    )
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_activity_window_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_window_stats() TO anon;
