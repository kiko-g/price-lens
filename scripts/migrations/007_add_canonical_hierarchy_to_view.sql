-- ============================================================================
-- Migration: Add canonical category hierarchy to store_products_with_canonical view
-- This adds parent category names so we can display the full path like:
-- "Food > Dairy > Milk" instead of just "Milk"
-- ============================================================================

-- Recreate view with full hierarchy (up to 3 levels)
CREATE OR REPLACE VIEW store_products_with_canonical
WITH (security_invoker = true) AS
SELECT
  sp.*,
  cm.canonical_category_id,
  -- Level 3 (most specific - the mapped category)
  cc.name as canonical_category_name,
  cc.level as canonical_level,
  cc.parent_id as canonical_parent_id,
  -- Level 2 (parent of mapped category, if exists)
  cc_parent.name as canonical_category_name_2,
  cc_parent.parent_id as canonical_parent_id_2,
  -- Level 1 (root category)
  cc_grandparent.name as canonical_category_name_3
FROM store_products sp
LEFT JOIN category_mappings cm ON
  sp.origin_id = cm.origin_id
  AND sp.category = cm.store_category
  AND (
    (sp.category_2 IS NULL AND cm.store_category_2 IS NULL)
    OR sp.category_2 = cm.store_category_2
  )
  AND (
    (sp.category_3 IS NULL AND cm.store_category_3 IS NULL)
    OR sp.category_3 = cm.store_category_3
  )
LEFT JOIN canonical_categories cc ON cm.canonical_category_id = cc.id
LEFT JOIN canonical_categories cc_parent ON cc.parent_id = cc_parent.id
LEFT JOIN canonical_categories cc_grandparent ON cc_parent.parent_id = cc_grandparent.id;

-- ============================================================================
-- Note: After running this migration, you'll also need to:
-- 1. Regenerate Supabase types: pnpm db:types
-- 2. Update src/types/index.ts StoreProduct interface to include new fields
-- ============================================================================
