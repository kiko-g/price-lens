-- Migration: Create upsert_price_point RPC
-- Moves price comparison logic into the database to eliminate egress.
-- Instead of: SELECT latest price → compare in JS → write,
-- this does it all server-side and returns only a status string.

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
BEGIN
  -- Skip invalid price data
  IF p_price IS NULL OR p_price <= 0 THEN
    RETURN jsonb_build_object('action', 'skipped', 'reason', 'invalid_price');
  END IF;

  -- Find the latest price point for this product
  SELECT id, price, price_recommended, price_per_major_unit
  INTO v_existing
  FROM prices
  WHERE store_product_id = p_store_product_id
  ORDER BY valid_from DESC
  LIMIT 1;

  IF FOUND THEN
    -- Compare the 3 price fields
    IF v_existing.price IS NOT DISTINCT FROM p_price
       AND v_existing.price_recommended IS NOT DISTINCT FROM p_price_recommended
       AND v_existing.price_per_major_unit IS NOT DISTINCT FROM p_price_per_major_unit
    THEN
      -- Price unchanged: just bump the updated_at timestamp
      UPDATE prices SET updated_at = p_timestamp WHERE id = v_existing.id;
      UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
      v_action := 'unchanged';
    ELSE
      -- Price changed: close ALL open price points, insert new one
      UPDATE prices
      SET valid_to = p_timestamp, updated_at = p_timestamp
      WHERE store_product_id = p_store_product_id AND valid_to IS NULL;

      INSERT INTO prices (store_product_id, price, price_recommended, price_per_major_unit, discount, valid_from, valid_to, created_at, updated_at)
      VALUES (p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit, p_discount, p_timestamp, NULL, p_timestamp, p_timestamp)
      RETURNING id INTO v_new_price_id;

      UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
      v_action := 'updated';
    END IF;
  ELSE
    -- First price point for this product
    INSERT INTO prices (store_product_id, price, price_recommended, price_per_major_unit, discount, valid_from, valid_to, created_at, updated_at)
    VALUES (p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit, p_discount, p_timestamp, NULL, p_timestamp, p_timestamp)
    RETURNING id INTO v_new_price_id;

    UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
    v_action := 'created';
  END IF;

  RETURN jsonb_build_object('action', v_action);
END;
$$;
