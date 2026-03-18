-- Migration 034: Full-text search infrastructure for store_products
-- Adds a weighted tsvector column with Portuguese stemming + accent removal,
-- a GIN index, a maintenance trigger, and a relevance-ranked search RPC.
--
-- Prerequisites: pg_trgm (installed), unaccent (installed)
-- Estimated disk: ~10-16 MB (column + GIN index on ~150k rows)

-- ============================================================================
-- 1. Immutable unaccent wrapper
-- ============================================================================
-- unaccent() is STABLE, not IMMUTABLE, which prevents use in text search
-- configurations and generated columns. This wrapper is the standard pattern.

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- ============================================================================
-- 2. Portuguese + unaccent text search configuration
-- ============================================================================
-- "acucar" matches "Açúcar", "leites" matches "leite", etc.

DO $$ BEGIN
  CREATE TEXT SEARCH CONFIGURATION portuguese_unaccent (COPY = portuguese);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
  ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
  WITH unaccent, portuguese_stem;

-- ============================================================================
-- 3. Add search_vector column
-- ============================================================================

ALTER TABLE store_products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- 4. Trigger to maintain search_vector on INSERT/UPDATE
-- ============================================================================
-- Weights: A = name (highest), B = brand, C = category

CREATE OR REPLACE FUNCTION store_products_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese_unaccent', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese_unaccent', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('portuguese_unaccent', coalesce(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_products_search_vector ON store_products;
CREATE TRIGGER trg_store_products_search_vector
  BEFORE INSERT OR UPDATE OF name, brand, category
  ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION store_products_search_vector_update();

-- ============================================================================
-- 5. Backfill existing rows
-- ============================================================================

UPDATE store_products SET
  search_vector =
    setweight(to_tsvector('portuguese_unaccent', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('portuguese_unaccent', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('portuguese_unaccent', coalesce(category, '')), 'C');

-- ============================================================================
-- 6. GIN index on search_vector (run standalone for CONCURRENTLY)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_store_products_search_vector
  ON store_products USING gin (search_vector);

-- ============================================================================
-- 7. Relevance-ranked search RPC
-- ============================================================================
-- Returns SETOF store_products so PostgREST can chain filters (.eq, .in, .range)
-- on the result. When no .order() is specified, PostgREST preserves the
-- function's ORDER BY ts_rank_cd — giving relevance sorting for free.

CREATE OR REPLACE FUNCTION search_products_ranked(query_text text)
RETURNS SETOF store_products
LANGUAGE sql STABLE
AS $$
  SELECT sp.*
  FROM store_products sp,
       websearch_to_tsquery('portuguese_unaccent', query_text) q
  WHERE sp.search_vector @@ q
  ORDER BY ts_rank_cd(sp.search_vector, q) DESC;
$$;

-- ============================================================================
-- 8. Update store_products_with_canonical view to include search_vector
-- ============================================================================
-- Recreate with sp.* so search_vector (and future columns) are included.

DROP VIEW IF EXISTS store_products_with_canonical;
CREATE VIEW store_products_with_canonical
WITH (security_invoker = true) AS
SELECT
  sp.*,
  cm.canonical_category_id,
  cc.name   AS canonical_category_name,
  cc.level  AS canonical_level,
  cc.parent_id AS canonical_parent_id,
  cc_parent.name AS canonical_category_name_2,
  cc_parent.parent_id AS canonical_parent_id_2,
  cc_grandparent.name AS canonical_category_name_3
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
