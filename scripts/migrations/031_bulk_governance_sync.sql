-- Migration 031: Bulk governance sync
-- Run each step INDIVIDUALLY in Supabase SQL Editor (not all at once).
-- This bypasses Vercel API timeouts by running directly against Postgres.
--
-- Steps:
--   0. Preview counts (read-only, run first to sanity-check)
--   1. Update priorities for tracked categories (safe, non-destructive)
--   2. Park products with unmapped categories (safe, non-destructive)
--   3. Veto products in untracked categories (destructive — deletes rows)
--   4. Post-check counts

-- ============================================================================
-- STEP 0: PREVIEW COUNTS — run this first to see what will happen
-- ============================================================================

SELECT
  'will_update_priority' AS action,
  count(*) AS cnt
FROM store_products sp
JOIN category_mappings cm
  ON cm.origin_id = sp.origin_id
  AND cm.store_category = sp.category
  AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
  AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
WHERE cc.tracked = true
  AND cc.default_priority IS NOT NULL
  AND sp.category IS NOT NULL

UNION ALL

SELECT
  'will_park_unmapped' AS action,
  count(*) AS cnt
FROM store_products sp
WHERE sp.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM category_mappings cm
    WHERE cm.origin_id = sp.origin_id
      AND cm.store_category = sp.category
      AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
      AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
  )

UNION ALL

SELECT
  'will_veto_untracked' AS action,
  count(*) AS cnt
FROM store_products sp
JOIN category_mappings cm
  ON cm.origin_id = sp.origin_id
  AND cm.store_category = sp.category
  AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
  AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
WHERE cc.tracked = false
  AND sp.category IS NOT NULL

UNION ALL

SELECT
  'no_category_data' AS action,
  count(*) AS cnt
FROM store_products sp
WHERE sp.category IS NULL

UNION ALL

SELECT
  'total_store_products' AS action,
  count(*) AS cnt
FROM store_products;


-- ============================================================================
-- STEP 1: UPDATE PRIORITIES for products in tracked categories
-- (non-destructive — sets priority + priority_source)
-- ============================================================================

UPDATE store_products sp
SET
  priority = cc.default_priority,
  priority_source = 'category_default',
  priority_updated_at = now()
FROM category_mappings cm
JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
WHERE sp.origin_id = cm.origin_id
  AND sp.category = cm.store_category
  AND COALESCE(sp.category_2, '') = COALESCE(cm.store_category_2, '')
  AND COALESCE(sp.category_3, '') = COALESCE(cm.store_category_3, '')
  AND cc.tracked = true
  AND cc.default_priority IS NOT NULL
  AND sp.category IS NOT NULL;


-- ============================================================================
-- STEP 2: PARK products with unmapped categories
-- (non-destructive — sets priority=0, priority_source='unmapped')
-- ============================================================================

UPDATE store_products sp
SET
  priority = 0,
  priority_source = 'unmapped',
  priority_updated_at = now()
WHERE sp.category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM category_mappings cm
    WHERE cm.origin_id = sp.origin_id
      AND cm.store_category = sp.category
      AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
      AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
  );


-- ============================================================================
-- STEP 3: VETO products in untracked categories (DESTRUCTIVE)
-- Run sub-steps 3a → 3b → 3c → 3d in order.
-- ============================================================================

-- 3a. Record vetoed SKUs (so discovery won't re-add them)
INSERT INTO vetoed_store_skus (origin_id, sku, store_category, vetoed_at)
SELECT DISTINCT
  sp.origin_id,
  CASE
    WHEN sp.origin_id IN (1, 3)
      THEN regexp_replace(sp.url, '.*-(\d+)\.html$', '\1')
    WHEN sp.origin_id = 2
      THEN regexp_replace(sp.url, '.*/(\d+)\.html$', '\1')
  END,
  sp.category,
  now()
FROM store_products sp
JOIN category_mappings cm
  ON cm.origin_id = sp.origin_id
  AND cm.store_category = sp.category
  AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
  AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
WHERE cc.tracked = false
  AND sp.category IS NOT NULL
ON CONFLICT (origin_id, sku) DO NOTHING;

-- 3b. Delete price history for vetoed products
DELETE FROM prices
WHERE store_product_id IN (
  SELECT sp.id
  FROM store_products sp
  JOIN category_mappings cm
    ON cm.origin_id = sp.origin_id
    AND cm.store_category = sp.category
    AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
    AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
  JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
  WHERE cc.tracked = false
    AND sp.category IS NOT NULL
);

-- 3c. Delete user favorites for vetoed products
DELETE FROM user_favorites
WHERE store_product_id IN (
  SELECT sp.id
  FROM store_products sp
  JOIN category_mappings cm
    ON cm.origin_id = sp.origin_id
    AND cm.store_category = sp.category
    AND COALESCE(cm.store_category_2, '') = COALESCE(sp.category_2, '')
    AND COALESCE(cm.store_category_3, '') = COALESCE(sp.category_3, '')
  JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
  WHERE cc.tracked = false
    AND sp.category IS NOT NULL
);

-- 3d. Delete the store products themselves
DELETE FROM store_products sp
USING category_mappings cm
JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
WHERE sp.origin_id = cm.origin_id
  AND sp.category = cm.store_category
  AND COALESCE(sp.category_2, '') = COALESCE(cm.store_category_2, '')
  AND COALESCE(sp.category_3, '') = COALESCE(cm.store_category_3, '')
  AND cc.tracked = false
  AND sp.category IS NOT NULL;


-- ============================================================================
-- STEP 4: POST-CHECK — verify the results
-- ============================================================================

SELECT priority_source, count(*) AS cnt
FROM store_products
GROUP BY priority_source
ORDER BY cnt DESC;

-- Check total remaining
SELECT count(*) AS total_remaining FROM store_products;

-- Check vetoed SKUs count
SELECT count(*) AS vetoed_skus FROM vetoed_store_skus;


-- ============================================================================
-- STEP 5 (OPTIONAL): VACUUM FULL to reclaim disk space
-- Run ONLY after confirming all counts look correct.
-- This locks the tables briefly — avoid during peak traffic.
-- ============================================================================

-- VACUUM FULL store_products;
-- VACUUM FULL prices;
-- VACUUM FULL vetoed_store_skus;
