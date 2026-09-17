-- Reviewer read-only guarantee at the database level.
--
-- The app enforces read-only in the middleware, but a reviewer also holds a normal
-- Supabase JWT and could talk to PostgREST directly. `store_products` and `prices`
-- have permissive write policies for anon + authenticated (the scraper relies on them),
-- so without this a reviewer could still write to those tables from the browser.
--
-- RESTRICTIVE policies are AND-ed with the permissive ones: for the `authenticated`
-- role a write now also requires the caller not to be a reviewer. Anon (scraper) and
-- other users are unaffected. Own-row consumer tables (favorites, alerts, lists,
-- profile) are intentionally left writable so the reviewer can use the consumer app.

CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'reviewer'
  );
$$;

REVOKE ALL ON FUNCTION public.is_reviewer() FROM public;
GRANT EXECUTE ON FUNCTION public.is_reviewer() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.is_reviewer() IS
  'True when the current JWT belongs to a profiles.role = reviewer account (used by restrictive RLS).';

-- store_products: existing permissive policies "Insert" / "Update" (anon, authenticated)
DROP POLICY IF EXISTS "Reviewer is read-only (insert)" ON public.store_products;
CREATE POLICY "Reviewer is read-only (insert)" ON public.store_products
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_reviewer());

DROP POLICY IF EXISTS "Reviewer is read-only (update)" ON public.store_products;
CREATE POLICY "Reviewer is read-only (update)" ON public.store_products
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.is_reviewer())
  WITH CHECK (NOT public.is_reviewer());

DROP POLICY IF EXISTS "Reviewer is read-only (delete)" ON public.store_products;
CREATE POLICY "Reviewer is read-only (delete)" ON public.store_products
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.is_reviewer());

-- prices: existing permissive INSERT / UPDATE / DELETE policies (anon, authenticated)
DROP POLICY IF EXISTS "Reviewer is read-only (insert)" ON public.prices;
CREATE POLICY "Reviewer is read-only (insert)" ON public.prices
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_reviewer());

DROP POLICY IF EXISTS "Reviewer is read-only (update)" ON public.prices;
CREATE POLICY "Reviewer is read-only (update)" ON public.prices
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.is_reviewer())
  WITH CHECK (NOT public.is_reviewer());

DROP POLICY IF EXISTS "Reviewer is read-only (delete)" ON public.prices;
CREATE POLICY "Reviewer is read-only (delete)" ON public.prices
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.is_reviewer());

-- Admin-gated tables (canonical_categories, category_mappings) already require
-- role = 'admin' in their permissive policies, so no extra guard is needed there.
