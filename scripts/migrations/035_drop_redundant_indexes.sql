-- Migration 035: Drop redundant indexes on store_products
-- Reclaims ~4 MB locally (likely more in production due to bloat).
--
-- All four indexes are fully covered by existing compound indexes:
--   idx_store_products_priority          → subsumed by both compound indexes that lead with (available, priority)
--   idx_store_products_category          → subsumed by idx_store_products_categories (origin_id, category, category_2, category_3)
--   products_origin_id_idx              → subsumed by idx_store_products_origin_available_priority_updated (origin_id, ...)
--   idx_store_products_available_origin_priority → subsumed by idx_store_products_origin_available_priority_updated
--     which covers (origin_id, available, priority DESC, updated_at DESC) — same leading columns, more useful trailing sort.

-- 896 KB. Every query filtering on priority also filters on available/origin_id.
DROP INDEX IF EXISTS idx_store_products_priority;

-- 1.1 MB. Standalone category; idx_store_products_categories covers (origin_id, category, category_2, category_3).
DROP INDEX IF EXISTS idx_store_products_category;

-- 936 KB. Standalone origin_id; the compound index leads with origin_id already.
DROP INDEX IF EXISTS products_origin_id_idx;

-- 1.0 MB. (available, origin_id, priority) is a subset of
-- idx_store_products_origin_available_priority_updated (origin_id, available, priority DESC, updated_at DESC).
DROP INDEX IF EXISTS idx_store_products_available_origin_priority;
