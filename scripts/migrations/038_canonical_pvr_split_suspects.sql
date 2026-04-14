-- Migration 038: List “split suspect” canonical groups — same brand + identical PVPR,
-- small group size (e.g. exactly 2 when max_exclusive=3) suggesting a possible missing merge.
--
-- Params:
--   p_min_size       — minimum canonicals per group (default 2)
--   p_max_exclusive  — group size must be < this (default 3 → only size 2)
--   p_source         — 'auto' | 'all'
--   p_limit          — max groups returned (capped at 500)

CREATE OR REPLACE FUNCTION list_canonical_pvr_split_suspect_groups(
  p_min_size INT DEFAULT 2,
  p_max_exclusive INT DEFAULT 3,
  p_source TEXT DEFAULT 'auto',
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  brand_key TEXT,
  pvr_value NUMERIC,
  group_size INT,
  canonical_ids BIGINT[],
  canonical_names TEXT[]
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
      cpp.pvr_rounded
    FROM canonical_products cp
    INNER JOIN canonical_pvr cpp ON cpp.cp_id = cp.id
    WHERE cp.brand IS NOT NULL
      AND length(trim(cp.brand)) > 0
      AND (
        p_source = 'all'
        OR (p_source = 'auto' AND cp.source = 'auto')
      )
  ),
  grouped AS (
    SELECT
      e.bkey AS gb_brand,
      e.pvr_rounded AS gb_pvr,
      COUNT(*)::INT AS gsize,
      array_agg(e.id ORDER BY e.id) AS gids,
      array_agg(e.name ORDER BY e.id) AS gnames
    FROM eligible e
    GROUP BY e.bkey, e.pvr_rounded
    HAVING COUNT(*) >= p_min_size
       AND COUNT(*) < p_max_exclusive
  )
  SELECT
    gb_brand AS brand_key,
    gb_pvr AS pvr_value,
    gsize AS group_size,
    gids AS canonical_ids,
    gnames AS canonical_names
  FROM grouped
  ORDER BY gsize DESC, gb_brand, gb_pvr
  LIMIT LEAST(COALESCE(NULLIF(p_limit, 0), 100), 500);
$$;

COMMENT ON FUNCTION list_canonical_pvr_split_suspect_groups IS
  'Admin triage: canonical groups sharing lower(trim(brand)) and one consistent rounded PVPR per canonical; sizes in [p_min_size, p_max_exclusive).';
