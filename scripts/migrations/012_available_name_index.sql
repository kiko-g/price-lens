-- Migration: Add composite index for the default products page query
-- The default query is: WHERE available = true ORDER BY name ASC LIMIT N
-- Without this index, Postgres must either scan idx_store_products_name and
-- filter per-row, or use idx_store_products_available and then sort.
-- This composite index allows a single ordered index scan.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_products_available_name
ON store_products (available, name);
