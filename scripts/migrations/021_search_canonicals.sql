-- Search canonical products by name or brand.
-- Used by the admin orphan-linking dialog.
CREATE OR REPLACE FUNCTION search_canonical_products(
  search_term TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (id BIGINT, name TEXT, brand TEXT, barcode_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT cp.id, cp.name, cp.brand, COUNT(ti.id) AS barcode_count
  FROM canonical_products cp
  LEFT JOIN trade_items ti ON ti.canonical_product_id = cp.id
  WHERE cp.name ILIKE '%' || search_term || '%'
     OR cp.brand ILIKE '%' || search_term || '%'
  GROUP BY cp.id
  ORDER BY COUNT(ti.id) DESC
  LIMIT result_limit;
$$;

-- Find trade_items in single-barcode canonicals (orphans).
-- These are candidates for manual re-linking to multi-barcode groups.
CREATE OR REPLACE FUNCTION get_orphan_trade_items(
  search_term TEXT DEFAULT NULL,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  trade_item_id BIGINT,
  gtin TEXT,
  off_product_name TEXT,
  gs1_prefix TEXT,
  canonical_product_id BIGINT,
  canonical_name TEXT,
  canonical_brand TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ti.id AS trade_item_id,
    ti.gtin,
    ti.off_product_name,
    ti.gs1_prefix,
    ti.canonical_product_id,
    cp.name AS canonical_name,
    cp.brand AS canonical_brand
  FROM trade_items ti
  JOIN canonical_products cp ON cp.id = ti.canonical_product_id
  WHERE ti.canonical_product_id IN (
    SELECT canonical_product_id
    FROM trade_items
    WHERE canonical_product_id IS NOT NULL
    GROUP BY canonical_product_id
    HAVING COUNT(*) = 1
  )
  AND (
    search_term IS NULL
    OR ti.gtin ILIKE '%' || search_term || '%'
    OR ti.off_product_name ILIKE '%' || search_term || '%'
    OR cp.name ILIKE '%' || search_term || '%'
    OR cp.brand ILIKE '%' || search_term || '%'
  )
  ORDER BY cp.brand NULLS LAST, cp.name
  LIMIT result_limit
  OFFSET result_offset;
$$;

CREATE OR REPLACE FUNCTION count_orphan_trade_items(
  search_term TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::BIGINT
  FROM trade_items ti
  JOIN canonical_products cp ON cp.id = ti.canonical_product_id
  WHERE ti.canonical_product_id IN (
    SELECT canonical_product_id
    FROM trade_items
    WHERE canonical_product_id IS NOT NULL
    GROUP BY canonical_product_id
    HAVING COUNT(*) = 1
  )
  AND (
    search_term IS NULL
    OR ti.gtin ILIKE '%' || search_term || '%'
    OR ti.off_product_name ILIKE '%' || search_term || '%'
    OR cp.name ILIKE '%' || search_term || '%'
    OR cp.brand ILIKE '%' || search_term || '%'
  );
$$;
