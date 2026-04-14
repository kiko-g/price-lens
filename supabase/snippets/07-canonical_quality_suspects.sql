-- Canonical quality triage (read-only). Run against local or remote Postgres / Supabase SQL editor.
--
-- 1) Auto groups with more than 3 distinct barcodes (likely overstuffed for PT3-chain setup)
SELECT id, name, brand, barcode_count, store_count, source, created_at
FROM canonical_products
WHERE source = 'auto'
  AND barcode_count > 3
ORDER BY barcode_count DESC, id
LIMIT 200;

-- 2) Same canonical + same store origin but more than one distinct consumer GTIN
--    (should not happen after Pass 2 origin-family gates; indicates legacy bad data)
WITH per_origin AS (
  SELECT
    ti.canonical_product_id AS canonical_id,
    sp.origin_id,
    COUNT(DISTINCT ti.gtin) AS distinct_gtins
  FROM trade_items ti
  INNER JOIN store_products sp ON sp.trade_item_id = ti.id AND sp.origin_id IS NOT NULL
  WHERE ti.canonical_product_id IS NOT NULL
  GROUP BY ti.canonical_product_id, sp.origin_id
)
SELECT c.id, c.name, c.brand, p.origin_id, p.distinct_gtins
FROM per_origin p
INNER JOIN canonical_products c ON c.id = p.canonical_id
WHERE p.distinct_gtins > 1
ORDER BY p.distinct_gtins DESC, c.id
LIMIT 200;

-- 3) Split suspects: same normalized brand + identical PVPR (one rounded PVR per canonical),
--    group size in [min, max) — default min=2 max_exclusive=3 → pairs only.
--    Migration: scripts/migrations/038_canonical_pvr_split_suspects.sql
--    HTTP: GET /api/admin/canonical-matches/split-suspects
SELECT *
FROM list_canonical_pvr_split_suspect_groups(
  p_min_size := 2,
  p_max_exclusive := 3,
  p_source := 'auto',
  p_limit := 200,
  p_min_name_similarity := 0.45
);
