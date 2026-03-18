-- Migration 036: Enable RLS on tables that currently have none
-- Fixes 4 CRITICAL "RLS Disabled in Public" advisors from Supabase dashboard.
--
-- Tables: canonical_products, trade_items, scrape_runs, vetoed_store_skus
--
-- All writes to these tables go through service_role (which bypasses RLS),
-- except scrape_runs INSERT which comes from the batch-worker via the anon key.
--
-- NOTE: store_products and prices have RLS enabled but overly permissive
-- write policies for anon. Fixing those requires migrating scraping/pricing
-- code to use createAdminClient() first — tracked separately.

-- ============================================================================
-- 1. canonical_products — read-only for public, writes via service_role
-- ============================================================================
ALTER TABLE canonical_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON canonical_products FOR SELECT
  USING (true);

-- ============================================================================
-- 2. trade_items — read-only for public, writes via service_role
-- ============================================================================
ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON trade_items FOR SELECT
  USING (true);

-- ============================================================================
-- 3. vetoed_store_skus — read-only for public, writes via service_role
-- ============================================================================
ALTER TABLE vetoed_store_skus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON vetoed_store_skus FOR SELECT
  USING (true);

-- ============================================================================
-- 4. scrape_runs — read for public, INSERT for anon (batch-worker needs it)
-- ============================================================================
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON scrape_runs FOR SELECT
  USING (true);

CREATE POLICY "Anon can insert scrape runs"
  ON scrape_runs FOR INSERT
  TO anon
  WITH CHECK (true);
