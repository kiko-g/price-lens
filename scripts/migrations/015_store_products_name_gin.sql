-- Migration: GIN index on store_products(name) for fast ILIKE '%...%' (quick search).
-- Requires extension pg_trgm (already installed). Speeds up name-only quick search API.
--
-- Existing idx_store_products_name (btree) is kept: btree cannot be used for
-- leading-wildcard ILIKE; it helps ORDER BY name and prefix matches. This GIN
-- index is additive for containment/similarity (quick search).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_products_name_gin
ON store_products USING gin (name gin_trgm_ops);
