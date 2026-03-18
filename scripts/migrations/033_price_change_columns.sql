-- Migration: Add precomputed price change columns to store_products
-- These columns enable price-change sorting and card badges without per-product queries.

-- 1. Add columns
ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS price_change_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS last_price_change_at TIMESTAMPTZ;

-- 2. Index for price-change sorting (ASC so biggest drops come first)
CREATE INDEX IF NOT EXISTS idx_sp_price_change_pct
  ON store_products (price_change_pct ASC NULLS LAST)
  WHERE available = true AND name IS NOT NULL AND name <> '';

-- 3. Update upsert_price_point to maintain these columns on price change
CREATE OR REPLACE FUNCTION upsert_price_point(
  p_store_product_id BIGINT,
  p_price NUMERIC,
  p_price_recommended NUMERIC,
  p_price_per_major_unit NUMERIC,
  p_discount NUMERIC,
  p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing RECORD;
  v_action TEXT;
  v_new_price_id BIGINT;
  v_change_pct NUMERIC;
BEGIN
  IF p_price IS NULL OR p_price <= 0 THEN
    RETURN jsonb_build_object('action', 'skipped', 'reason', 'invalid_price');
  END IF;

  SELECT id, price, price_recommended, price_per_major_unit
  INTO v_existing
  FROM prices
  WHERE store_product_id = p_store_product_id
  ORDER BY valid_from DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.price IS NOT DISTINCT FROM p_price
       AND v_existing.price_recommended IS NOT DISTINCT FROM p_price_recommended
       AND v_existing.price_per_major_unit IS NOT DISTINCT FROM p_price_per_major_unit
    THEN
      UPDATE prices SET updated_at = p_timestamp WHERE id = v_existing.id;
      UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
      v_action := 'unchanged';
    ELSE
      -- Compute % change from previous price
      IF v_existing.price IS NOT NULL AND v_existing.price > 0 THEN
        v_change_pct := (p_price - v_existing.price) / v_existing.price;
      ELSE
        v_change_pct := NULL;
      END IF;

      UPDATE prices
      SET valid_to = p_timestamp, updated_at = p_timestamp
      WHERE store_product_id = p_store_product_id AND valid_to IS NULL;

      INSERT INTO prices (store_product_id, price, price_recommended, price_per_major_unit, discount, valid_from, valid_to, created_at, updated_at)
      VALUES (p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit, p_discount, p_timestamp, NULL, p_timestamp, p_timestamp)
      RETURNING id INTO v_new_price_id;

      UPDATE store_products
      SET updated_at = p_timestamp,
          price_change_pct = v_change_pct,
          last_price_change_at = p_timestamp
      WHERE id = p_store_product_id;

      v_action := 'updated';
    END IF;
  ELSE
    INSERT INTO prices (store_product_id, price, price_recommended, price_per_major_unit, discount, valid_from, valid_to, created_at, updated_at)
    VALUES (p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit, p_discount, p_timestamp, NULL, p_timestamp, p_timestamp)
    RETURNING id INTO v_new_price_id;

    UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
    v_action := 'created';
  END IF;

  RETURN jsonb_build_object('action', v_action);
END;
$$;

-- 4. Backfill: compute price_change_pct from the last 2 price rows per product
WITH ranked AS (
  SELECT
    store_product_id,
    price,
    valid_from,
    ROW_NUMBER() OVER (PARTITION BY store_product_id ORDER BY valid_from DESC) AS rn
  FROM prices
  WHERE price IS NOT NULL AND price > 0
),
deltas AS (
  SELECT
    cur.store_product_id,
    CASE WHEN prev.price > 0 THEN (cur.price - prev.price) / prev.price ELSE NULL END AS change_pct,
    cur.valid_from AS change_at
  FROM ranked cur
  JOIN ranked prev ON cur.store_product_id = prev.store_product_id AND prev.rn = 2
  WHERE cur.rn = 1
)
UPDATE store_products sp
SET price_change_pct = d.change_pct,
    last_price_change_at = d.change_at
FROM deltas d
WHERE sp.id = d.store_product_id;

-- 5. Recreate the canonical view to include new columns (sp.* already covers them)
-- The view uses sp.* so new columns are automatically included.
-- No action needed.
