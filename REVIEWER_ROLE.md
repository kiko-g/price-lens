# Read-only `reviewer` role

A `reviewer` is a dedicated account for the branding/product-review agent. It behaves like a
normal shopper (favorites, alerts, lists, profile — its own rows only) **and** can open every
`/admin` dashboard, but it can never mutate anything admin-side. It exists so the review agent
does not run on the founder's Google account and never gets `admin`.

| Capability                                          | `user` | `reviewer` | `admin` |
| --------------------------------------------------- | :----: | :--------: | :-----: |
| Consumer app, own favorites/alerts/lists/profile    |   ✓    |     ✓      |    ✓    |
| Open `/admin/*` pages                               |   –    |     ✓      |    ✓    |
| `GET /api/admin/*` (dashboards, analytics, brand …) |   –    |     ✓      |    ✓    |
| Any `POST/PUT/PATCH/DELETE` under `/api/admin/*`    |   –    |  **403**   |    ✓    |
| Server actions posted to `/admin/*` pages           |   –    |  **403**   |    ✓    |
| Side-effecting admin GETs (cron, triage, workers …) |   –    |  **403**   |    ✓    |
| Elevated writes outside `/api/admin` (see below)    |   ✓¹   |  **403**   |    ✓    |
| Change own `profiles.role`                          |   –    |     –      |    –    |

¹ Unchanged pre-existing behaviour for regular users; see "Known gaps".

## Where enforcement lives

1. **Middleware** — `src/lib/supabase/middleware.ts` calls the pure policy in
   `src/lib/auth/roles.ts`. For a reviewer on the admin surface only `GET/HEAD/OPTIONS` to an
   **allowlisted** read-only endpoint passes (`REVIEWER_ALLOWED_ADMIN_GETS`); anything else,
   including any new `/api/admin` route nobody has classified yet, is denied. Endpoints driven by
   `?action=` only pass for read-only values (`discovery?action=status`,
   `schedule?action=overview|activity-log|products-by-staleness|scrape-runs`). Side-effecting GETs
   (`cron`, `scrape/ai-priority`, `discovery/triage`, `alerts/scrape-health`, the cron worker
   targets) are declared in `SIDE_EFFECT_ADMIN_GETS`; `roles.test.ts` scans
   `src/app/api/admin/**/route.ts` and fails if a GET route is missing from both lists, so the
   lists cannot drift. Paths are normalised (trailing/duplicate slashes) before matching. It also
   denies reviewer writes on the "elevated" routes that live outside `/api/admin` but are admin
   tooling by intent: `PUT /api/prices`, `GET /api/prices/sanitize/*`,
   `POST /api/store_products/add|scrape`, `PATCH /api/store_products/bulk-priority`,
   `PUT /api/store_products/:id/priority`. Every denial is a
   `403 { error: "Forbidden: reviewer role is read-only" }` and is logged.
   The `updateProductPriority` server action re-checks the role itself (server actions can be
   posted to any page URL).
2. **UI** — `AdminWriteOnly` / `ReadOnlyNote` / `ReviewerReadOnlyBanner`
   (`src/components/admin/AdminWriteOnly.tsx`) hide every write control in `/admin` and show a
   persistent banner. `useIsAdmin()` stays admin-only (elevated controls), `useCanAccessAdmin()`
   is admin|reviewer (navigation), `useIsReviewer()` is reviewer-only.
3. **Database** —
   - `supabase/migrations/20260916120000_reviewer_role_enum.sql` adds the enum value. All
     existing write policies check `profiles.role = 'admin'` explicitly, so the new value grants
     no table writes. No reviewer-specific policies were added: admin GET payloads are produced
     server-side with the service role, so the reviewer needs no extra table grants.
   - `supabase/migrations/20260916120100_profiles_role_lock.sql` adds a trigger that rejects any
     change to `profiles.role` coming from the `anon`/`authenticated` PostgREST roles. Without it
     any signed-in user could `PATCH /rest/v1/profiles` and make themselves `admin`.
   - `supabase/migrations/20260916120200_reviewer_read_only_rls.sql` adds `is_reviewer()` and
     RESTRICTIVE policies on `store_products` and `prices` so the reviewer's own JWT cannot write
     those tables through PostgREST either (they are permissive for everyone else; the scraper
     depends on that). Own-row consumer tables stay writable on purpose.

## One-time setup (Francisco)

### 1. Apply the migrations

Run the three `20260916*` files in `supabase/migrations/` against the project (SQL editor or
`supabase db push`), **in order** and as separate transactions — the enum value must be committed
before anything references it. Deploying the app before the migrations is safe: nobody has the
role yet.

### 2. Enable password sign-in

Login is Google-only in the UI today. The reviewer signs in with email + password at
**`/login/reviewer`** (not linked from `/login`; consumers keep Google).

Supabase Dashboard → **Authentication → Sign In / Providers → Email** must be **Enabled** (it
already is on the production project). Leave Google as is. You do **not** need to allow email signups: the seed script creates the
user through the admin API and the app never calls `signUp`. If you prefer, keep
"Allow new users to sign up" off for email.

### 3. Seed the reviewer user

The script needs the service-role key and a password from the environment. Nothing is committed.

```bash
# .env.local / .env.development.local (gitignored) or the shell
NEXT_PUBLIC_SUPABASE_URL=…
SUPABASE_SERVICE_ROLE_KEY=…
REVIEWER_EMAIL=lince-reviewer@pricelens.dev   # optional, this is the default
REVIEWER_PASSWORD='<long random password>'     # >= 12 chars, never commit

pnpm seed:reviewer        # local/dev env files
pnpm seed:reviewer:prod   # .env.production
```

It creates the auth user (email confirmed), sets `profiles.role = 'reviewer'` and verifies it.
Re-running is safe: it resets the password when `REVIEWER_PASSWORD` is set and re-asserts the role.

Equivalent manual steps: Dashboard → Authentication → Users → **Add user** (email + password,
auto-confirm), then in the SQL editor
`update public.profiles set role = 'reviewer' where id = '<user uuid>';`
(the SQL editor runs as `postgres`, so the role-lock trigger lets it through).

Hand the email/password to the review agent out of band (secret manager), never in the repo or PR.

## Manual test plan

Sign in at `/login/reviewer` with the seeded account, then:

1. **Consumer product** — open `/favorites`, favorite a product, open `/profile` and the alerts
   tab. Everything works as a normal user (own rows via RLS).
2. **Admin read** — open `/admin`, `/admin/analytics`, `/admin/data-health`, `/admin/brand`.
   Pages load, the blue "Read-only reviewer mode" banner is visible, Save/Recompute/Run buttons
   are hidden and replaced by "Read-only reviewer — actions hidden".
3. **Admin write is blocked (fail closed)** — from the browser console while signed in:
   ```js
   await fetch("/api/admin/brand", { method: "PUT", headers: { "content-type": "application/json" }, body: "{}" }).then(
     (r) => r.status,
   ) // 403
   await fetch("/api/admin/analytics/recompute", { method: "POST" }).then((r) => r.status) // 403
   await fetch("/api/admin/discovery?action=run&origin=all").then((r) => r.status) // 403
   await fetch("/api/admin/cron?priority=5").then((r) => r.status) // 403
   await fetch("/api/admin/analytics").then((r) => r.status) // 200
   ```
4. **No self-promotion** — with the reviewer's JWT, `PATCH /rest/v1/profiles?id=eq.<uid>` with
   `{"role":"admin"}` returns `42501 profiles.role can only be changed by the service role`.
5. **Google users are unaffected** — sign in with Google on `/login` as before.

Automated coverage: `src/lib/auth/__tests__/roles.test.ts` (policy matrix) and
`src/lib/supabase/__tests__/middleware.test.ts` (middleware: reviewer 200 on `/admin/analytics`,
`/favorites`, GET admin APIs; 403 on every mutating/side-effecting route; admin unchanged).

## Known gaps (pre-existing, out of scope here)

- `store_products` and `prices` have permissive RLS (`INSERT/UPDATE`, and `DELETE` on prices) for
  `anon` **and** `authenticated`. The scraper relies on this through the anon client. Anyone with
  the anon key can write to those tables directly via PostgREST. The reviewer is now excluded by
  the restrictive policies above; fixing it for everyone means moving scraper writes to the
  service role first.
- `profiles.plan` is user-updatable the same way `role` was; the trigger only locks `role`.
- `/api/store_products/add`, `/api/store_products/scrape`, `/api/prices` (PUT) and the priority
  routes are not admin-gated for regular users; this change denies them for reviewers only.
- `supabase/migrations/20260418_profiles_locale.sql` has not been applied to production
  (`profiles.locale` does not exist there).
