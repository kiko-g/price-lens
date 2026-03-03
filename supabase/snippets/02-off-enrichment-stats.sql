-- OFF Enrichment Statistics
-- Run against local DB: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- Overall enrichment breakdown
SELECT
  count(*) AS total_trade_items,
  count(*) FILTER (WHERE off_product_name IS NOT NULL AND off_product_name != '') AS enriched,
  count(*) FILTER (WHERE off_product_name = '') AS not_in_off_or_non_food,
  count(*) FILTER (WHERE off_product_name IS NULL) AS pending
FROM trade_items;

-- Enrichment by barcode category
SELECT
  CASE
    WHEN gtin LIKE '978%' OR gtin LIKE '979%' THEN 'ISBN (books)'
    WHEN gtin LIKE '2%' AND length(gtin) = 13 THEN 'Internal/weight-based'
    WHEN length(gtin) < 8 THEN 'Short (store-internal)'
    WHEN length(gtin) BETWEEN 8 AND 14 THEN 'Valid EAN/UPC'
    ELSE 'Non-standard length'
  END AS category,
  count(*) AS total,
  count(*) FILTER (WHERE off_product_name != '' AND off_product_name IS NOT NULL) AS enriched
FROM trade_items
GROUP BY category
ORDER BY total DESC;

-- Enrichment by GS1 country prefix (EAN-13 only)
SELECT
  CASE
    WHEN gtin LIKE '560%' THEN '560 (Portugal)'
    WHEN gtin LIKE '84%'  THEN '84x (Spain)'
    WHEN gtin LIKE '3%' AND substring(gtin, 1, 2)::int BETWEEN 30 AND 37 THEN '3xx (France)'
    WHEN gtin LIKE '4%' AND substring(gtin, 1, 2)::int BETWEEN 40 AND 44 THEN '4xx (Germany)'
    WHEN gtin LIKE '50%' THEN '50x (UK)'
    WHEN gtin LIKE '76%' THEN '76x (Switzerland)'
    ELSE 'Other'
  END AS origin,
  count(*) AS total,
  count(*) FILTER (WHERE off_product_name != '' AND off_product_name IS NOT NULL) AS enriched,
  round(100.0 * count(*) FILTER (WHERE off_product_name != '' AND off_product_name IS NOT NULL) / count(*), 1) AS pct
FROM trade_items
WHERE length(gtin) >= 8
  AND NOT (gtin LIKE '978%' OR gtin LIKE '979%')
  AND NOT (gtin LIKE '2%' AND length(gtin) = 13)
GROUP BY origin
ORDER BY total DESC;
