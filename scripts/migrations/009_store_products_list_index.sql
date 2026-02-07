-- Migration 009: Index cleanup + new compound index + drop products table
-- Run in Supabase SQL Editor
-- Executed: 2026-02-07

-- ============================================================================
-- Part 1: Drop duplicate indexes (re-point FKs to primary key first)
-- ============================================================================

-- Drop FKs that depend on products_id_key (they reference the redundant unique
-- constraint instead of the primary key)
ALTER TABLE prices DROP CONSTRAINT IF EXISTS prices_supermarket_product_id_fkey;
ALTER TABLE user_favorites DROP CONSTRAINT IF EXISTS user_favorites_store_product_id_fkey;

-- Drop the redundant unique constraint (duplicate of products_pkey)
ALTER TABLE store_products DROP CONSTRAINT IF EXISTS products_id_key;

-- Re-create FKs (now bind to products_pkey automatically)
ALTER TABLE prices
  ADD CONSTRAINT prices_supermarket_product_id_fkey
  FOREIGN KEY (store_product_id) REFERENCES store_products(id);

ALTER TABLE user_favorites
  ADD CONSTRAINT user_favorites_store_product_id_fkey
  FOREIGN KEY (store_product_id) REFERENCES store_products(id);

-- Drop other duplicate indexes
DROP INDEX IF EXISTS idx_canonical_categories_parent_id;
DROP INDEX IF EXISTS idx_store_products_available;

-- ============================================================================
-- Part 2: Add compound index for main product list query
-- Run standalone (CONCURRENTLY cannot be inside a transaction)
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_products_origin_available_priority_updated
ON store_products (origin_id, available, priority DESC NULLS LAST, updated_at DESC NULLS LAST)
WHERE name IS NOT NULL AND name != '';

-- ============================================================================
-- Part 3: Drop legacy products table
-- ============================================================================

-- Drop the view that references product_id
DROP VIEW IF EXISTS store_products_with_canonical;

-- Drop FK and column
ALTER TABLE store_products DROP CONSTRAINT IF EXISTS store_products_product_id_fkey;
ALTER TABLE store_products DROP COLUMN IF EXISTS product_id;

-- Recreate view without product_id
CREATE VIEW store_products_with_canonical AS
SELECT sp.url,
    sp.name,
    sp.brand,
    sp.pack,
    sp.price,
    sp.price_recommended,
    sp.price_per_major_unit,
    sp.major_unit,
    sp.image,
    sp.category,
    sp.category_2,
    sp.category_3,
    sp.discount,
    sp.id,
    sp.created_at,
    sp.updated_at,
    sp.origin_id,
    sp.priority,
    sp.priority_updated_at,
    sp.priority_source,
    sp.barcode,
    sp.available,
    sp.scraped_at,
    cm.canonical_category_id,
    cc.name AS canonical_category_name,
    cc.level AS canonical_level,
    cc.parent_id AS canonical_parent_id,
    cc_parent.name AS canonical_category_name_2,
    cc_parent.parent_id AS canonical_parent_id_2,
    cc_grandparent.name AS canonical_category_name_3
FROM store_products sp
    LEFT JOIN category_mappings cm ON sp.origin_id = cm.origin_id AND sp.category = cm.store_category AND (sp.category_2 IS NULL AND cm.store_category_2 IS NULL OR sp.category_2 = cm.store_category_2) AND (sp.category_3 IS NULL AND cm.store_category_3 IS NULL OR sp.category_3 = cm.store_category_3)
    LEFT JOIN canonical_categories cc ON cm.canonical_category_id = cc.id
    LEFT JOIN canonical_categories cc_parent ON cc.parent_id = cc_parent.id
    LEFT JOIN canonical_categories cc_grandparent ON cc_parent.parent_id = cc_grandparent.id;

-- Drop the products table and its remaining indexes
DROP TABLE IF EXISTS products CASCADE;
