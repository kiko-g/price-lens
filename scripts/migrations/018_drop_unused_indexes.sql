-- Migration 018: Drop underused indexes on store_products
-- Reclaims ~56 MB of disk space (out of 174 MB total index footprint)
--
-- After running this migration, execute manually via Supabase SQL Editor:
--   VACUUM FULL store_products;
-- This reclaims ~62 MB of table bloat but requires an exclusive lock (~30-60s).

-- 24 MB, 1 scan. Redundant with idx_store_products_available_priority_updated
-- and idx_store_products_origin_available_priority_updated.
DROP INDEX IF EXISTS idx_store_products_priority_updated_at;

-- 15 MB, 178 scans. ILIKE/textSearch uses the GIN index;
-- ORDER BY name uses idx_store_products_available_name.
DROP INDEX IF EXISTS idx_store_products_name;

-- 8.3 MB, 92 scans. ORDER BY price queries always filter first on
-- available/priority/origin_id, so the planner sorts a small result set in memory.
DROP INDEX IF EXISTS idx_store_products_price;

-- 5.6 MB, 293 scans. Only 3 distinct values (null/ai/manual) — too low
-- selectivity for a btree. Always a secondary filter after priority.
DROP INDEX IF EXISTS idx_store_products_priority_source;

-- 2.7 MB, 12 scans. Used only for WHERE discount > 0 which is rare,
-- and low cardinality means the planner rarely picks this index anyway.
DROP INDEX IF EXISTS idx_store_products_discount;
