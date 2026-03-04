-- Migration 022: Admin canonical browse RPCs
--
-- Replaces get_canonical_matches/count_canonical_matches (which required
-- multi-barcode canonicals) with general-purpose browse RPCs that can
-- list ALL canonical products with optional filters.
-- Adds delete_canonical_product for admin cleanup.

-- =========================================================================
-- 1. Drop old RPCs (superseded)
-- =========================================================================

DROP FUNCTION IF EXISTS get_canonical_matches(INT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS count_canonical_matches(INT, TEXT);

-- =========================================================================
-- 2. Browse all canonical products
-- =========================================================================

CREATE OR REPLACE FUNCTION list_canonical_products(
  search_term TEXT DEFAULT NULL,
  min_barcodes INT DEFAULT 1,
  min_stores INT DEFAULT 1,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  canonical_id BIGINT,
  name TEXT,
  brand TEXT,
  source TEXT,
  barcodes BIGINT,
  stores BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id AS canonical_id,
    cp.name,
    cp.brand,
    cp.source,
    COUNT(DISTINCT ti.gtin) AS barcodes,
    COUNT(DISTINCT sp.origin_id) AS stores
  FROM canonical_products cp
  LEFT JOIN trade_items ti ON ti.canonical_product_id = cp.id
  LEFT JOIN store_products sp ON sp.trade_item_id = ti.id
  WHERE (search_term IS NULL
         OR cp.name ILIKE '%' || search_term || '%'
         OR cp.brand ILIKE '%' || search_term || '%'
         OR ti.gtin LIKE '%' || search_term || '%')
  GROUP BY cp.id, cp.name, cp.brand, cp.source
  HAVING COUNT(DISTINCT ti.gtin) >= min_barcodes
     AND COUNT(DISTINCT sp.origin_id) >= min_stores
  ORDER BY COUNT(DISTINCT sp.origin_id) DESC, COUNT(DISTINCT ti.gtin) DESC, cp.name
  LIMIT result_limit
  OFFSET result_offset;
$$;

CREATE OR REPLACE FUNCTION count_canonical_products(
  search_term TEXT DEFAULT NULL,
  min_barcodes INT DEFAULT 1,
  min_stores INT DEFAULT 1
)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::BIGINT FROM (
    SELECT cp.id
    FROM canonical_products cp
    LEFT JOIN trade_items ti ON ti.canonical_product_id = cp.id
    LEFT JOIN store_products sp ON sp.trade_item_id = ti.id
    WHERE (search_term IS NULL
           OR cp.name ILIKE '%' || search_term || '%'
           OR cp.brand ILIKE '%' || search_term || '%'
           OR ti.gtin LIKE '%' || search_term || '%')
    GROUP BY cp.id
    HAVING COUNT(DISTINCT ti.gtin) >= min_barcodes
       AND COUNT(DISTINCT sp.origin_id) >= min_stores
  ) sub;
$$;

-- =========================================================================
-- 3. Delete canonical product (admin cleanup)
-- =========================================================================

CREATE OR REPLACE FUNCTION delete_canonical_product(target_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE store_products
  SET canonical_product_id = NULL
  WHERE canonical_product_id = target_id;

  UPDATE trade_items
  SET canonical_product_id = NULL
  WHERE canonical_product_id = target_id;

  DELETE FROM canonical_products
  WHERE id = target_id;
END;
$$;
