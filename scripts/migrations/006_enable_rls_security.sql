-- Migration: Enable Row Level Security
-- Description: Fixes 3 Supabase Security Advisor errors:
--   1. RLS Disabled in Public: canonical_categories
--   2. RLS Disabled in Public: category_mappings
--   3. Security Definer View: store_products_with_canonical
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- 1. Enable RLS on canonical_categories
-- ============================================================================
ALTER TABLE canonical_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for category filter UI)
CREATE POLICY "Anyone can read canonical_categories"
  ON canonical_categories FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admin can modify canonical_categories"
  ON canonical_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update canonical_categories"
  ON canonical_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete canonical_categories"
  ON canonical_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 2. Enable RLS on category_mappings
-- ============================================================================
ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;

-- Public read access (required for store_products_with_canonical view JOIN)
CREATE POLICY "Anyone can read category_mappings"
  ON category_mappings FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admin can modify category_mappings"
  ON category_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update category_mappings"
  ON category_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete category_mappings"
  ON category_mappings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. Fix store_products_with_canonical view (SECURITY INVOKER)
-- ============================================================================
-- Recreate view explicitly as SECURITY INVOKER to respect RLS on underlying tables
CREATE OR REPLACE VIEW store_products_with_canonical
WITH (security_invoker = true) AS
SELECT
  sp.*,
  cm.canonical_category_id,
  cc.name as canonical_category_name,
  cc.level as canonical_level,
  cc.parent_id as canonical_parent_id
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
LEFT JOIN canonical_categories cc ON cm.canonical_category_id = cc.id;

-- ============================================================================
-- Done! Now click "Rerun linter" in Security Advisor to verify fixes.
-- ============================================================================
