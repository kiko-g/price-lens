-- Read-only `reviewer` role.
--
-- A reviewer is a dedicated, non-founder account that can sign in as a normal shopper
-- and *read* the admin dashboards (/admin pages, GET /api/admin/*) but must never be
-- able to mutate anything admin-side. Enforcement lives in the Next.js middleware
-- (src/lib/supabase/middleware.ts + src/lib/auth/roles.ts) and in RLS: every existing
-- write policy checks `profiles.role = 'admin'` explicitly, so adding this enum value
-- grants no table writes.
--
-- Kept in its own migration on purpose: Postgres does not allow a freshly added enum
-- value to be referenced inside the same transaction that added it.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'reviewer';
