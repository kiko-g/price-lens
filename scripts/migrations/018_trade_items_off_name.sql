-- Migration 018: Add Open Food Facts product name to trade_items
--
-- Caches the OFF-normalized product name per GTIN so matching
-- can compare standardised names across barcodes.

ALTER TABLE trade_items
  ADD COLUMN IF NOT EXISTS off_product_name TEXT;
