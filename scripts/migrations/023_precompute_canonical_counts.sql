-- Migration 023: Pre-compute barcode_count / store_count on canonical_products
--
-- The browse RPCs (list_canonical_products, count_canonical_products) previously
-- did a 3-way JOIN + GROUP BY on every call — far too heavy for Supabase free tier.
-- This migration adds cached counts as columns and rewrites the RPCs to use them.

-- =========================================================================
-- 1. Add pre-computed count columns
-- =========================================================================

ALTER TABLE canonical_products
  ADD COLUMN IF NOT EXISTS barcode_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_count   INT NOT NULL DEFAULT 0;

-- =========================================================================
-- 2. Batched refresh RPC (REST-API safe)
-- =========================================================================

CREATE OR REPLACE FUNCTION refresh_canonical_counts_batch(batch_size INT DEFAULT 2000)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  WITH stale AS (
    SELECT cp.id,
           COALESCE(agg.bc, 0) AS new_bc,
           COALESCE(agg.sc, 0) AS new_sc
    FROM canonical_products cp
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT ti.gtin)::INT AS bc,
             COUNT(DISTINCT sp.origin_id)::INT AS sc
      FROM trade_items ti
      LEFT JOIN store_products sp ON sp.trade_item_id = ti.id
      WHERE ti.canonical_product_id = cp.id
    ) agg ON TRUE
    WHERE cp.barcode_count != COALESCE(agg.bc, 0)
       OR cp.store_count   != COALESCE(agg.sc, 0)
    LIMIT batch_size
  )
  UPDATE canonical_products cp
  SET barcode_count = stale.new_bc,
      store_count   = stale.new_sc
  FROM stale
  WHERE cp.id = stale.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- =========================================================================
-- 3. Indexes for the new browse queries
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_canonical_products_counts
  ON canonical_products (store_count DESC, barcode_count DESC, name);

-- pg_trgm for fast ILIKE search on name/brand
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_canonical_products_name_trgm
  ON canonical_products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_canonical_products_brand_trgm
  ON canonical_products USING gin (brand gin_trgm_ops);

-- =========================================================================
-- 4. Rewrite browse RPCs (no joins for default view)
-- =========================================================================

DROP FUNCTION IF EXISTS list_canonical_products(TEXT, INT, INT, INT, INT);

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
  barcodes INT,
  stores INT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cp.id AS canonical_id,
    cp.name,
    cp.brand,
    cp.source,
    cp.barcode_count AS barcodes,
    cp.store_count   AS stores
  FROM canonical_products cp
  WHERE cp.barcode_count >= min_barcodes
    AND cp.store_count   >= min_stores
    AND (
      search_term IS NULL
      OR cp.name  ILIKE '%' || search_term || '%'
      OR cp.brand ILIKE '%' || search_term || '%'
    )
  ORDER BY cp.store_count DESC, cp.barcode_count DESC, cp.name
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
  SELECT COUNT(*)::BIGINT
  FROM canonical_products cp
  WHERE cp.barcode_count >= min_barcodes
    AND cp.store_count   >= min_stores
    AND (
      search_term IS NULL
      OR cp.name  ILIKE '%' || search_term || '%'
      OR cp.brand ILIKE '%' || search_term || '%'
    );
$$;

-- =========================================================================
-- 5. Rewrite orphan RPCs (use barcode_count = 1 instead of subquery)
-- =========================================================================

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
  WHERE cp.barcode_count = 1
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
  WHERE cp.barcode_count = 1
    AND (
      search_term IS NULL
      OR ti.gtin ILIKE '%' || search_term || '%'
      OR ti.off_product_name ILIKE '%' || search_term || '%'
      OR cp.name ILIKE '%' || search_term || '%'
      OR cp.brand ILIKE '%' || search_term || '%'
    );
$$;

-- =========================================================================
-- 6. Rewrite search_canonical_products (used by link dialog)
-- =========================================================================

DROP FUNCTION IF EXISTS search_canonical_products(TEXT, INT);

CREATE OR REPLACE FUNCTION search_canonical_products(
  search_term TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (id BIGINT, name TEXT, brand TEXT, barcode_count INT)
LANGUAGE sql STABLE
AS $$
  SELECT cp.id, cp.name, cp.brand, cp.barcode_count
  FROM canonical_products cp
  WHERE cp.name ILIKE '%' || search_term || '%'
     OR cp.brand ILIKE '%' || search_term || '%'
  ORDER BY cp.barcode_count DESC
  LIMIT result_limit;
$$;
