-- Find duplicate products by base URL (without query parameters)
-- This query strips everything after '?' and groups by the clean URL

WITH cleaned_urls AS (
  SELECT 
    id,
    url,
    SPLIT_PART(url, '?', 1) as base_url,
    name,
    barcode,
    created_at
  FROM store_products
  WHERE url IS NOT NULL
),
duplicates AS (
  SELECT 
    base_url,
    COUNT(*) as duplicate_count
  FROM cleaned_urls
  GROUP BY base_url
  HAVING COUNT(*) > 1
)
SELECT 
  c.id,
  c.url,
  c.base_url,
  c.name,
  c.barcode,
  c.created_at,
  d.duplicate_count
FROM cleaned_urls c
JOIN duplicates d ON c.base_url = d.base_url
ORDER BY c.base_url, c.created_at;
