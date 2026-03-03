-- Migration 020: Canonical Products & Trade Items (consolidated for production)
--
-- Merges 017, 018, 018b, 019 into a single idempotent migration.
-- Creates the product normalization layer:
--   canonical_products  — one row per "base product" (brand + volume + variant)
--   trade_items         — one row per unique GTIN/barcode
--   store_products      — gains nullable FKs to both new tables
--   RPC functions       — for admin canonical match review

-- =========================================================================
-- 1. Tables
-- =========================================================================

CREATE TABLE IF NOT EXISTS canonical_products (
  id           BIGSERIAL    PRIMARY KEY,
  name         TEXT         NOT NULL,
  brand        TEXT,
  volume_value NUMERIC,
  volume_unit  TEXT,
  source       TEXT         NOT NULL DEFAULT 'auto',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_items (
  id                    BIGSERIAL    PRIMARY KEY,
  gtin                  TEXT         UNIQUE NOT NULL,
  gtin_format           TEXT         NOT NULL,
  gs1_prefix            TEXT,
  canonical_product_id  BIGINT       REFERENCES canonical_products(id),
  off_product_name      TEXT,
  source                TEXT         NOT NULL DEFAULT 'scraped',
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. store_products FKs
-- =========================================================================

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS trade_item_id        BIGINT REFERENCES trade_items(id),
  ADD COLUMN IF NOT EXISTS canonical_product_id BIGINT REFERENCES canonical_products(id);

-- =========================================================================
-- 3. Indexes
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_trade_items_canonical
  ON trade_items(canonical_product_id);

CREATE INDEX IF NOT EXISTS idx_store_products_trade_item
  ON store_products(trade_item_id);

CREATE INDEX IF NOT EXISTS idx_store_products_canonical
  ON store_products(canonical_product_id);

-- =========================================================================
-- 4. Drop underused store_products indexes (~56 MB reclaimed)
-- =========================================================================

DROP INDEX IF EXISTS idx_store_products_priority_updated_at;
DROP INDEX IF EXISTS idx_store_products_name;
DROP INDEX IF EXISTS idx_store_products_price;
DROP INDEX IF EXISTS idx_store_products_priority_source;
DROP INDEX IF EXISTS idx_store_products_discount;

-- =========================================================================
-- 5. Denormalization helper
-- =========================================================================

CREATE OR REPLACE FUNCTION denormalize_canonical_ids()
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  SET LOCAL statement_timeout = '120s';

  UPDATE store_products sp
  SET canonical_product_id = ti.canonical_product_id
  FROM trade_items ti
  WHERE ti.id = sp.trade_item_id
    AND ti.canonical_product_id IS NOT NULL
    AND (sp.canonical_product_id IS NULL
         OR sp.canonical_product_id != ti.canonical_product_id);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- =========================================================================
-- 6. RPC functions for canonical match review
-- =========================================================================

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
