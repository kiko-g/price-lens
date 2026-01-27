-- Migration: Canonical Categories System
-- Description: Creates tables and views for normalizing store-specific categories
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- Table: canonical_categories
-- The unified taxonomy (3-level hierarchy using parent_id for self-reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS canonical_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES canonical_categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_canonical_categories_parent ON canonical_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_canonical_categories_level ON canonical_categories(level);

-- Ensure unique names within the same parent (allow same name in different branches)
CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_categories_unique_name_parent 
  ON canonical_categories(name, COALESCE(parent_id, 0));

-- ============================================================================
-- Table: category_mappings
-- Links store category tuples to canonical categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS category_mappings (
  id SERIAL PRIMARY KEY,
  origin_id INTEGER NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  store_category TEXT NOT NULL,
  store_category_2 TEXT,
  store_category_3 TEXT,
  canonical_category_id INTEGER NOT NULL REFERENCES canonical_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each store tuple can only map to one canonical category (using index for nullable columns)
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_mappings_unique_tuple 
  ON category_mappings(origin_id, store_category, COALESCE(store_category_2, ''), COALESCE(store_category_3, ''));

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_category_mappings_origin ON category_mappings(origin_id);
CREATE INDEX IF NOT EXISTS idx_category_mappings_canonical ON category_mappings(canonical_category_id);
CREATE INDEX IF NOT EXISTS idx_category_mappings_tuple ON category_mappings(store_category, store_category_2, store_category_3);

-- ============================================================================
-- View: store_products_with_canonical
-- Joins store_products with their canonical category (if mapped)
-- ============================================================================
CREATE OR REPLACE VIEW store_products_with_canonical AS
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
-- Function: get_distinct_store_category_tuples
-- Returns all unique category tuples from store_products with product counts
-- NOTE: Using BIGINT for origin_id to match store_products table type
-- ============================================================================
CREATE OR REPLACE FUNCTION get_distinct_store_category_tuples()
RETURNS TABLE (
  origin_id BIGINT,
  store_category TEXT,
  store_category_2 TEXT,
  store_category_3 TEXT,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.origin_id::BIGINT,
    sp.category::TEXT as store_category,
    sp.category_2::TEXT as store_category_2,
    sp.category_3::TEXT as store_category_3,
    COUNT(*)::BIGINT as product_count
  FROM store_products sp
  WHERE sp.category IS NOT NULL
  GROUP BY sp.origin_id, sp.category, sp.category_2, sp.category_3
  ORDER BY sp.origin_id, sp.category, sp.category_2, sp.category_3;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: get_category_mapping_stats
-- Returns coverage statistics for category mappings
-- NOTE: Using BIGINT for origin_id to match store_products table type
-- ============================================================================
CREATE OR REPLACE FUNCTION get_category_mapping_stats()
RETURNS TABLE (
  origin_id BIGINT,
  origin_name TEXT,
  total_tuples BIGINT,
  mapped_tuples BIGINT,
  unmapped_tuples BIGINT,
  total_products BIGINT,
  mapped_products BIGINT,
  coverage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH tuple_counts AS (
    SELECT 
      sp.origin_id,
      sp.category,
      sp.category_2,
      sp.category_3,
      COUNT(*) as product_count,
      CASE 
        WHEN cm.id IS NOT NULL THEN true 
        ELSE false 
      END as is_mapped
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
    WHERE sp.category IS NOT NULL
    GROUP BY sp.origin_id, sp.category, sp.category_2, sp.category_3, cm.id
  )
  SELECT 
    tc.origin_id::BIGINT,
    s.name::TEXT as origin_name,
    COUNT(DISTINCT (tc.category, tc.category_2, tc.category_3))::BIGINT as total_tuples,
    COUNT(DISTINCT (tc.category, tc.category_2, tc.category_3)) FILTER (WHERE tc.is_mapped)::BIGINT as mapped_tuples,
    COUNT(DISTINCT (tc.category, tc.category_2, tc.category_3)) FILTER (WHERE NOT tc.is_mapped)::BIGINT as unmapped_tuples,
    COALESCE(SUM(tc.product_count), 0)::BIGINT as total_products,
    COALESCE(SUM(tc.product_count) FILTER (WHERE tc.is_mapped), 0)::BIGINT as mapped_products,
    COALESCE(ROUND(
      (SUM(tc.product_count) FILTER (WHERE tc.is_mapped)::NUMERIC / NULLIF(SUM(tc.product_count), 0)) * 100, 
      2
    ), 0) as coverage_percentage
  FROM tuple_counts tc
  JOIN supermarkets s ON tc.origin_id = s.id
  GROUP BY tc.origin_id, s.name
  ORDER BY tc.origin_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) - Enable if needed
-- ============================================================================
-- For now, these tables are admin-only, so RLS may not be needed
-- If you want to enable RLS later:
-- ALTER TABLE canonical_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admin access" ON canonical_categories FOR ALL USING (true);
-- CREATE POLICY "Admin access" ON category_mappings FOR ALL USING (true);
