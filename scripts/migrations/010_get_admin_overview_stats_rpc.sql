-- Migration: Create get_admin_overview_stats RPC function
-- Replaces 16 individual count queries with a single aggregated query
-- Expected performance improvement: ~2.8s avg / 6.9s cold -> sub-500ms

CREATE OR REPLACE FUNCTION get_admin_overview_stats()
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    -- Global scrape status
    'total', count(*),
    'available', count(*) FILTER (WHERE available = true),
    'unavailable', count(*) FILTER (WHERE available = false),
    'never_scraped', count(*) FILTER (WHERE scraped_at IS NULL AND url IS NOT NULL),
    -- Quick stats
    'recently_scraped_24h', count(*) FILTER (WHERE scraped_at >= now() - interval '24 hours'),
    'with_barcode', count(*) FILTER (WHERE barcode IS NOT NULL),
    'high_priority', count(*) FILTER (WHERE priority >= 3),
    -- Per-origin: Continente (origin_id = 1)
    'continente_total', count(*) FILTER (WHERE origin_id = 1),
    'continente_available', count(*) FILTER (WHERE origin_id = 1 AND available = true),
    'continente_unavailable', count(*) FILTER (WHERE origin_id = 1 AND available = false),
    -- Per-origin: Auchan (origin_id = 2)
    'auchan_total', count(*) FILTER (WHERE origin_id = 2),
    'auchan_available', count(*) FILTER (WHERE origin_id = 2 AND available = true),
    'auchan_unavailable', count(*) FILTER (WHERE origin_id = 2 AND available = false),
    -- Per-origin: Pingo Doce (origin_id = 3)
    'pingo_doce_total', count(*) FILTER (WHERE origin_id = 3),
    'pingo_doce_available', count(*) FILTER (WHERE origin_id = 3 AND available = true),
    'pingo_doce_unavailable', count(*) FILTER (WHERE origin_id = 3 AND available = false),
    -- Prices count (subquery to avoid separate HTTP round-trip)
    'total_price_points', (SELECT count(*) FROM prices)
  )
  FROM store_products;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_overview_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_overview_stats() TO anon;
