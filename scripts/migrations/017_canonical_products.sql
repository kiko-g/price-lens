-- Migration 017: Canonical Products & Trade Items
--
-- Adds a product normalization layer:
--   canonical_products  — one row per "base product" (brand + volume + variant)
--   trade_items          — one row per unique GTIN/barcode
--   store_products       — gains nullable FKs to both new tables

-- 1. Canonical products table
CREATE TABLE IF NOT EXISTS canonical_products (
  id          BIGSERIAL    PRIMARY KEY,
  name        TEXT         NOT NULL,
  brand       TEXT,
  volume_value NUMERIC,
  volume_unit TEXT,                          -- 'ml', 'g', 'un'
  source      TEXT         NOT NULL DEFAULT 'auto',  -- 'auto' | 'manual'
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Trade items table (one per unique GTIN)
CREATE TABLE IF NOT EXISTS trade_items (
  id                    BIGSERIAL    PRIMARY KEY,
  gtin                  TEXT         UNIQUE NOT NULL,
  gtin_format           TEXT         NOT NULL,       -- 'ean13','ean8','gtin14','upca'
  gs1_prefix            TEXT,                        -- first 3 digits
  canonical_product_id  BIGINT       REFERENCES canonical_products(id),
  source                TEXT         NOT NULL DEFAULT 'scraped', -- 'scraped' | 'manual'
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_items_canonical
  ON trade_items(canonical_product_id);

-- 3. Add nullable FKs to store_products
ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS trade_item_id        BIGINT REFERENCES trade_items(id),
  ADD COLUMN IF NOT EXISTS canonical_product_id BIGINT REFERENCES canonical_products(id);

CREATE INDEX IF NOT EXISTS idx_store_products_trade_item
  ON store_products(trade_item_id);

CREATE INDEX IF NOT EXISTS idx_store_products_canonical
  ON store_products(canonical_product_id);
