-- Migration: Discovery Governance
-- Adds category-level tracking controls and vetoed SKU tracking
-- for filtering irrelevant products (books, electronics, toys, etc.)
-- Run AFTER all previous migrations in Supabase SQL Editor

-- ============================================================================
-- 1. Extend canonical_categories with governance columns
-- ============================================================================

ALTER TABLE canonical_categories
  ADD COLUMN IF NOT EXISTS tracked BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_priority INTEGER NOT NULL DEFAULT 2
    CHECK (default_priority BETWEEN 0 AND 5);

COMMENT ON COLUMN canonical_categories.tracked IS
  'Whether products in this category should be tracked. false = products will be vetoed during triage.';
COMMENT ON COLUMN canonical_categories.default_priority IS
  'Default priority assigned to newly triaged products in this category (0-5).';

-- ============================================================================
-- 2. Seed governance values for root canonical categories
-- ============================================================================

-- Mark 5 non-grocery L1 categories as untracked
UPDATE canonical_categories SET tracked = false WHERE level = 1 AND name IN (
  'Papelaria e Livraria',
  'Tecnologia e Eletrodomésticos',
  'Brinquedos e Jogos',
  'Desporto e Viagem',
  'Roupa e Acessórios'
);

-- Propagate tracked = false to all children of untracked roots
UPDATE canonical_categories child
SET tracked = false
FROM canonical_categories parent
WHERE child.parent_id = parent.id AND parent.tracked = false;

-- Propagate again for level 3 (grandchildren of untracked roots)
UPDATE canonical_categories grandchild
SET tracked = false
FROM canonical_categories child
WHERE grandchild.parent_id = child.id AND child.tracked = false;

-- Set default_priority = 3 (medium) for core food categories
UPDATE canonical_categories SET default_priority = 3 WHERE level = 1 AND name IN (
  'Bebidas',
  'Laticínios e Ovos',
  'Carnes e Talho',
  'Peixaria e Marisco',
  'Frutas e Legumes',
  'Padaria e Pastelaria',
  'Mercearia',
  'Congelados',
  'Charcutaria',
  'Refeições Prontas'
);

-- Set default_priority = 2 (low) for household/specialty (already default, but explicit)
UPDATE canonical_categories SET default_priority = 2 WHERE level = 1 AND name IN (
  'Higiene e Beleza',
  'Limpeza do Lar',
  'Casa e Jardim',
  'Bebé',
  'Animais',
  'Bio, Eco e Saudável',
  'Saúde e Parafarmácia'
);

-- Children inherit default_priority from their root parent
UPDATE canonical_categories child
SET default_priority = parent.default_priority
FROM canonical_categories parent
WHERE child.parent_id = parent.id AND child.level = 2;

UPDATE canonical_categories grandchild
SET default_priority = parent.default_priority
FROM canonical_categories parent
WHERE grandchild.parent_id = parent.id AND grandchild.level = 3;

-- ============================================================================
-- 3. Create vetoed_store_skus table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vetoed_store_skus (
  origin_id INTEGER NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  store_category TEXT,
  vetoed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (origin_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_vetoed_store_skus_origin
  ON vetoed_store_skus(origin_id);

COMMENT ON TABLE vetoed_store_skus IS
  'Lightweight record of SKUs excluded from tracking. Prevents re-discovery from sitemaps.';

-- ============================================================================
-- 4. Extend priority_source_type enum
-- ============================================================================

ALTER TYPE priority_source_type ADD VALUE IF NOT EXISTS 'category_default';

-- ============================================================================
-- 5. Helper: resolve tracked status + default_priority for a store category tuple
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_category_governance(
  p_origin_id INTEGER,
  p_category TEXT,
  p_category_2 TEXT DEFAULT NULL,
  p_category_3 TEXT DEFAULT NULL
)
RETURNS TABLE (
  canonical_category_id INTEGER,
  canonical_category_name TEXT,
  tracked BOOLEAN,
  default_priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.name,
    cc.tracked,
    cc.default_priority
  FROM category_mappings cm
  JOIN canonical_categories cc ON cc.id = cm.canonical_category_id
  WHERE cm.origin_id = p_origin_id
    AND cm.store_category = p_category
    AND (
      (p_category_2 IS NULL AND cm.store_category_2 IS NULL)
      OR cm.store_category_2 = p_category_2
    )
    AND (
      (p_category_3 IS NULL AND cm.store_category_3 IS NULL)
      OR cm.store_category_3 = p_category_3
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
