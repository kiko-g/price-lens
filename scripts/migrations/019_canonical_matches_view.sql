-- Migration 019: SQL function for canonical match review
--
-- Returns canonical products linked to multiple barcodes across multiple stores.
-- Much faster than doing this aggregation in application code.

CREATE OR REPLACE FUNCTION get_canonical_matches(
  min_stores INT DEFAULT 2,
  search_term TEXT DEFAULT NULL,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  canonical_id BIGINT,
  name TEXT,
  brand TEXT,
  barcodes BIGINT,
  stores BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id AS canonical_id,
    cp.name,
    cp.brand,
    COUNT(DISTINCT ti.gtin) AS barcodes,
    COUNT(DISTINCT sp.origin_id) AS stores
  FROM canonical_products cp
  JOIN trade_items ti ON ti.canonical_product_id = cp.id
  JOIN store_products sp ON sp.trade_item_id = ti.id
  WHERE (search_term IS NULL
         OR cp.name ILIKE '%' || search_term || '%'
         OR cp.brand ILIKE '%' || search_term || '%')
  GROUP BY cp.id, cp.name, cp.brand
  HAVING COUNT(DISTINCT ti.gtin) > 1
     AND COUNT(DISTINCT sp.origin_id) >= min_stores
  ORDER BY COUNT(DISTINCT sp.origin_id) DESC, COUNT(DISTINCT ti.gtin) DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;

CREATE OR REPLACE FUNCTION count_canonical_matches(
  min_stores INT DEFAULT 2,
  search_term TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::BIGINT FROM (
    SELECT cp.id
    FROM canonical_products cp
    JOIN trade_items ti ON ti.canonical_product_id = cp.id
    JOIN store_products sp ON sp.trade_item_id = ti.id
    WHERE (search_term IS NULL
           OR cp.name ILIKE '%' || search_term || '%'
           OR cp.brand ILIKE '%' || search_term || '%')
    GROUP BY cp.id
    HAVING COUNT(DISTINCT ti.gtin) > 1
       AND COUNT(DISTINCT sp.origin_id) >= min_stores
  ) sub;
$$;
