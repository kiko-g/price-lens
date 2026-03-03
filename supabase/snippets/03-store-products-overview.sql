-- Store Products Overview
-- Run against local DB: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- Total counts
SELECT
  count(*) AS total_store_products,
  count(*) FILTER (WHERE barcode IS NOT NULL AND barcode != '') AS with_barcode,
  count(*) FILTER (WHERE barcode IS NULL OR barcode = '') AS no_barcode,
  count(DISTINCT barcode) FILTER (WHERE barcode IS NOT NULL AND barcode != '') AS distinct_barcodes
FROM store_products;

-- Cross-store barcode sharing
-- Shows how many barcodes appear in 1, 2, or all 3 stores
SELECT stores_count, count(*) AS barcodes
FROM (
  SELECT barcode, count(DISTINCT origin_id) AS stores_count
  FROM store_products
  WHERE barcode IS NOT NULL AND barcode != ''
  GROUP BY barcode
) sub
GROUP BY stores_count
ORDER BY stores_count;

-- Product sector breakdown (food vs non-food)
SELECT
  CASE
    WHEN lower(category) LIKE '%livro%' OR lower(category) LIKE '%book%' OR lower(category) LIKE '%papelaria%' THEN 'Books/Stationery'
    WHEN lower(category) LIKE '%casa%' OR lower(category) LIKE '%decoração%' OR lower(category) LIKE '%cozinha%' OR lower(category) LIKE '%mesa%' THEN 'Home/Kitchen'
    WHEN lower(category) LIKE '%animal%' OR lower(category) LIKE '%pet%' THEN 'Pet'
    WHEN lower(category) LIKE '%higiene%' OR lower(category) LIKE '%beleza%' OR lower(category) LIKE '%cosmetic%' OR lower(category) LIKE '%perfum%' THEN 'Personal Care'
    WHEN lower(category) LIKE '%limpeza%' OR lower(category) LIKE '%detergent%' THEN 'Cleaning'
    WHEN lower(category) LIKE '%brinquedo%' OR lower(category) LIKE '%jardim%' OR lower(category) LIKE '%bricolage%' THEN 'Toys/Garden/DIY'
    WHEN lower(category) LIKE '%vinho%' OR lower(category) LIKE '%cerveja%' OR lower(category) LIKE '%bebida%' OR lower(category) LIKE '%agua%' THEN 'Drinks'
    ELSE 'Food/Other'
  END AS sector,
  count(DISTINCT barcode) AS distinct_barcodes,
  count(DISTINCT barcode) FILTER (
    WHERE barcode IN (SELECT gtin FROM trade_items WHERE off_product_name IS NOT NULL AND off_product_name != '')
  ) AS enriched
FROM store_products
WHERE barcode IS NOT NULL AND barcode != ''
GROUP BY sector
ORDER BY distinct_barcodes DESC;
