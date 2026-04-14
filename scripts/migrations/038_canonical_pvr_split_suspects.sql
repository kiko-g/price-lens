-- Migration 038: List “split suspect” canonical groups — same brand + identical PVPR,
-- small group size (e.g. exactly 2 when max_exclusive=3) suggesting a possible missing merge.
--
-- Params:
--   p_min_size              — minimum canonicals per group (default 2)
--   p_max_exclusive         — group size must be < this (default 3 → only size 2)
--   p_source                — 'auto' | 'all'
--   p_limit                 — max groups returned (capped at 500)
--   p_min_name_similarity   — for groups of exactly 2, require pg_trgm similarity(names) >= this;
--                             use 0 to disable (noisy). Default 0.45.
--
-- Requires: pg_trgm (see 023_precompute_canonical_counts.sql)

CREATE OR REPLACE FUNCTION list_canonical_pvr_split_suspect_groups(
  p_min_size INT DEFAULT 2,
  p_max_exclusive INT DEFAULT 3,
  p_source TEXT DEFAULT 'auto',
  p_limit INT DEFAULT 100,
  p_min_name_similarity REAL DEFAULT 0.45
)
RETURNS TABLE (
  brand_key TEXT,
  pvr_value NUMERIC,
  group_size INT,
  canonical_ids BIGINT[],
  canonical_names TEXT[],
  name_similarity REAL
)
LANGUAGE sql STABLE
AS $$
  WITH canonical_pvr AS (
    SELECT
      ti.canonical_product_id AS cp_id,
      MAX(
        CASE
          WHEN sp.price_recommended IS NOT NULL AND sp.price_recommended > 0
            THEN round(sp.price_recommended::numeric, 2)
        END
      ) AS pvr_rounded
    FROM trade_items ti
    INNER JOIN store_products sp ON sp.trade_item_id = ti.id
    WHERE ti.canonical_product_id IS NOT NULL
    GROUP BY ti.canonical_product_id
    HAVING COUNT(
      DISTINCT CASE
        WHEN sp.price_recommended IS NOT NULL AND sp.price_recommended > 0
          THEN round(sp.price_recommended::numeric, 2)
      END
    ) = 1
  ),
  eligible AS (
    SELECT
      cp.id,
      cp.name,
      lower(trim(cp.brand)) AS bkey,
      cpp.pvr_rounded,
      cp.volume_value,
      cp.volume_unit
    FROM canonical_products cp
    INNER JOIN canonical_pvr cpp ON cpp.cp_id = cp.id
    WHERE cp.brand IS NOT NULL
      AND length(trim(cp.brand)) >= 3
      -- Drop junk “brands” (pure numbers, punctuation-only, etc.); require a Latin letter
      AND cp.brand ~ '[A-Za-z]'
      AND (
        p_source = 'all'
        OR (p_source = 'auto' AND cp.source = 'auto')
      )
  ),
  grouped AS (
    SELECT
      e.bkey AS gb_brand,
      e.pvr_rounded AS gb_pvr,
      e.volume_value AS gb_vol_v,
      e.volume_unit AS gb_vol_u,
      COUNT(*)::INT AS gsize,
      array_agg(e.id ORDER BY e.id) AS gids,
      array_agg(e.name ORDER BY e.id) AS gnames
    FROM eligible e
    GROUP BY e.bkey, e.pvr_rounded, e.volume_value, e.volume_unit
    HAVING COUNT(*) >= p_min_size
       AND COUNT(*) < p_max_exclusive
  ),
  filtered AS (
    SELECT
      g.*,
      CASE
        WHEN g.gsize = 2
          THEN similarity(g.gnames[1], g.gnames[2])::REAL
        ELSE NULL::REAL
      END AS nsim
    FROM grouped g
    WHERE
      g.gsize <> 2
      OR COALESCE(p_min_name_similarity, 0)::REAL <= 0 OR similarity(g.gnames[1], g.gnames[2]) >= p_min_name_similarity::REAL
  )
  SELECT
    f.gb_brand AS brand_key,
    f.gb_pvr AS pvr_value,
    f.gsize AS group_size,
    f.gids AS canonical_ids,
    f.gnames AS canonical_names,
    f.nsim AS name_similarity
  FROM filtered f
  ORDER BY f.nsim DESC NULLS LAST, f.gsize DESC, f.gb_brand, f.gb_pvr
  LIMIT LEAST(COALESCE(NULLIF(p_limit, 0), 100), 500);
$$;

COMMENT ON FUNCTION list_canonical_pvr_split_suspect_groups IS
  'Admin triage: same normalized brand + pack volume + identical PVPR; small groups; pairs need pg_trgm name similarity unless p_min_name_similarity=0.';
