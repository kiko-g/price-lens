-- Migration: Volta (SDR) deposit amount on store_products and prices
-- price = shelf/tag price excluding deposit; deposit_amount tracks refundable Volta fee.
-- Volta rollout may replace SKUs (new barcode, old available=false) — see docs/successor-families-v0.md.

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(4, 2);

ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(4, 2);

CREATE OR REPLACE FUNCTION upsert_price_point(
  p_store_product_id BIGINT,
  p_price NUMERIC,
  p_price_recommended NUMERIC,
  p_price_per_major_unit NUMERIC,
  p_discount NUMERIC,
  p_deposit_amount NUMERIC DEFAULT NULL,
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

  SELECT id, price, price_recommended, price_per_major_unit, deposit_amount
  INTO v_existing
  FROM prices
  WHERE store_product_id = p_store_product_id
  ORDER BY valid_from DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.price IS NOT DISTINCT FROM p_price
       AND v_existing.price_recommended IS NOT DISTINCT FROM p_price_recommended
       AND v_existing.price_per_major_unit IS NOT DISTINCT FROM p_price_per_major_unit
       AND v_existing.deposit_amount IS NOT DISTINCT FROM p_deposit_amount
    THEN
      UPDATE prices SET updated_at = p_timestamp WHERE id = v_existing.id;
      UPDATE store_products SET updated_at = p_timestamp WHERE id = p_store_product_id;
      v_action := 'unchanged';
    ELSE
      -- Shelf price change only — deposit-only updates must not affect price_change_pct
      IF v_existing.price IS NOT NULL AND v_existing.price > 0
         AND v_existing.price IS DISTINCT FROM p_price
      THEN
        v_change_pct := (p_price - v_existing.price) / v_existing.price;
      ELSE
        v_change_pct := NULL;
      END IF;

      UPDATE prices
      SET valid_to = p_timestamp, updated_at = p_timestamp
      WHERE store_product_id = p_store_product_id AND valid_to IS NULL;

      INSERT INTO prices (
        store_product_id, price, price_recommended, price_per_major_unit,
        discount, deposit_amount, valid_from, valid_to, created_at, updated_at
      )
      VALUES (
        p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit,
        p_discount, p_deposit_amount, p_timestamp, NULL, p_timestamp, p_timestamp
      )
      RETURNING id INTO v_new_price_id;

      IF v_change_pct IS NOT NULL THEN
        UPDATE store_products
        SET updated_at = p_timestamp,
            price_change_pct = v_change_pct,
            last_price_change_at = p_timestamp,
            deposit_amount = p_deposit_amount
        WHERE id = p_store_product_id;
      ELSE
        UPDATE store_products
        SET updated_at = p_timestamp,
            deposit_amount = p_deposit_amount
        WHERE id = p_store_product_id;
      END IF;

      v_action := 'updated';
    END IF;
  ELSE
    INSERT INTO prices (
      store_product_id, price, price_recommended, price_per_major_unit,
      discount, deposit_amount, valid_from, valid_to, created_at, updated_at
    )
    VALUES (
      p_store_product_id, p_price, p_price_recommended, p_price_per_major_unit,
      p_discount, p_deposit_amount, p_timestamp, NULL, p_timestamp, p_timestamp
    )
    RETURNING id INTO v_new_price_id;

    UPDATE store_products
    SET updated_at = p_timestamp,
        deposit_amount = p_deposit_amount
    WHERE id = p_store_product_id;

    v_action := 'created';
  END IF;

  RETURN jsonb_build_object('action', v_action);
END;
$$;
