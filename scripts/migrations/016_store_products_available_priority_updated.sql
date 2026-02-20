-- Migration: Index for default products list (no origin filter).
-- Query: WHERE available = true AND name IS NOT NULL AND name <> ''
--       ORDER BY priority DESC NULLS LAST, updated_at DESC NULLS LAST LIMIT N
-- idx_store_products_origin_available_priority_updated has origin_id first, so
-- it is not used for the default "all stores" list. This index matches that case.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_products_available_priority_updated
ON store_products (available, priority DESC NULLS LAST, updated_at DESC NULLS LAST)
WHERE ((name IS NOT NULL) AND (name <> ''::text));
