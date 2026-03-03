-- Canonical Clustering Statistics
-- Run after Pass 2 to evaluate clustering quality.
-- Run against local DB: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- High-level summary
SELECT
  count(*) AS total_canonical_products,
  count(*) FILTER (WHERE ti_count = 1) AS singletons,
  count(*) FILTER (WHERE ti_count > 1) AS multi_barcode,
  count(*) FILTER (WHERE ti_count > 1 AND store_count > 1) AS cross_store_matches
FROM (
  SELECT
    cp.id,
    count(DISTINCT ti.id) AS ti_count,
    count(DISTINCT sp.origin_id) AS store_count
  FROM canonical_products cp
  JOIN trade_items ti ON ti.canonical_product_id = cp.id
  LEFT JOIN store_products sp ON sp.barcode = ti.gtin
  GROUP BY cp.id
) sub;

-- Canonical products with the most barcodes (possible over-grouping?)
SELECT cp.id, cp.name, cp.brand, count(DISTINCT ti.gtin) AS barcodes
FROM canonical_products cp
JOIN trade_items ti ON ti.canonical_product_id = cp.id
GROUP BY cp.id, cp.name, cp.brand
HAVING count(DISTINCT ti.gtin) > 2
ORDER BY barcodes DESC
LIMIT 20;

-- Cross-store canonical matches (the "Milka Strawberry" wins)
-- These are products with multiple barcodes found across multiple stores
SELECT
  cp.id, cp.name, cp.brand,
  count(DISTINCT ti.gtin) AS barcodes,
  count(DISTINCT sp.origin_id) AS stores,
  array_agg(DISTINCT ti.gtin) AS gtins
FROM canonical_products cp
JOIN trade_items ti ON ti.canonical_product_id = cp.id
JOIN store_products sp ON sp.barcode = ti.gtin
GROUP BY cp.id, cp.name, cp.brand
HAVING count(DISTINCT ti.gtin) > 1 AND count(DISTINCT sp.origin_id) > 1
ORDER BY stores DESC, barcodes DESC
LIMIT 30;

-- Sample singleton canonicals (one barcode only — most products)
SELECT cp.name, cp.brand, ti.gtin, ti.off_product_name
FROM canonical_products cp
JOIN trade_items ti ON ti.canonical_product_id = cp.id
WHERE cp.id IN (
  SELECT canonical_product_id
  FROM trade_items
  GROUP BY canonical_product_id
  HAVING count(*) = 1
)
ORDER BY random()
LIMIT 10;
