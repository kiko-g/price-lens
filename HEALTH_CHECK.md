# Price Lens — Massive Health Check (June 2026)

> Produced from a full audit of the codebase, the **production database** (Supabase `srpjxzydhsumqbrzpisa`), **Vercel runtime logs**, cron configuration, and the uncommitted working tree. Each topic has tasks/subtasks with checkboxes designed to be implemented in small, isolated pieces.
>
> **North star reminder:** Price Lens is an intelligence layer over PT supermarket prices. The engine (priority, volatility-aware cadence, dataset healing, product identity) *is* the product. Everything below is ranked by how much it blocks (1) users actually saving money and (2) the data being trustworthy enough to power that.

---

## 0. Executive summary — the state of the union

**The good news:** the core scrape loop is alive and healthy. ~27k scrapes/day, every 30 min, with `scrape_runs` telemetry, sane price-point semantics (`valid_from`/`valid_to`), good per-store scrapers with real unit tests, and a daily analytics snapshot that is current as of today.

**The bad news:** almost every piece of *intelligence and self-healing* around that loop is silently dead in production:

| Subsystem | Status | Evidence |
|---|---|---|
| Core scrape loop (`/api/scrape/scheduler`) | ✅ Healthy | 200s every 30 min, ~25k success/day |
| Analytics snapshot (`compute-worker`) | ✅ Healthy | Latest snapshot today, 11 in last 7d |
| **Volatility stats (`price-stats-worker`)** | 🔴 **Dead — 401 on every cron run** | 0 of 129k products have `price_stats_updated_at` set; Vercel logs show 401 |
| **Scrape health alerts (`alerts/scrape-health`)** | 🔴 **Dead — 401 on every cron run** | The watchdog that should have told you things were broken is itself broken |
| **Product discovery** | 🔴 **Dead since 2026-03-31** | Crons removed from `vercel.json`; 0 discovery runs in 30+ days |
| **Triage** | 🔴 Not scheduled | No cron; backlog only moves when run manually |
| **AI priority classifier** | 🔴 Effectively never ran | Only **11** products have `priority_source='ai'` |
| **P1 products** | 🔴 Never scraped | `ACTIVE_PRIORITIES=[5,4,3,2]` — "restore by ~20 Mar 2026" never reverted |
| **Canonical/identity pipeline** | 🟡 Manual script only | Cross-store match coverage stuck at ~18% |
| **Zombie recovery** | 🟡 Narrow path only | 52,889 unavailable products never re-checked in 30+ days |
| **Price alerts (user-facing)** | 🟡 Shipped but unused/unproven | 2 subscriptions, **0** alert events ever |

**The headline insight:** the project didn't rot from neglect — it rotted from **silent failure**. Two root causes account for most of the damage:

1. **Middleware cron allowlist** (`src/lib/supabase/middleware.ts:46`) only allows `compute-worker`, `discovery`, `discovery/triage` — so `price-stats-worker` and `alerts/scrape-health` get 401'd by middleware before their handlers run. Confirmed in Vercel logs (every invocation 401, today and presumably for months).
2. **Discovery crons were deleted from `vercel.json`** (commit `0822ab0` area) and never restored — the middleware still allowlists them, but nothing calls them.

Fixing ~10 lines of config/middleware revives the volatility layer, the health watchdog, and catalog discovery. That is the single highest-leverage action in this entire document.

---

## 1. Production data snapshot (2026-06-11)

Store mapping: `origin_id` 1 = Continente, 2 = Auchan, 3 = Pingo Doce (4 = El Corte Inglés, unused).

### Catalog & availability

| | Continente | Auchan | Pingo Doce | Total |
|---|---|---|---|---|
| Available | 26,337 | 37,383 | 9,274 | 72,994 |
| Unavailable | **43,308 (62%!)** | 11,377 | 2,131 | 56,816 |
| Barcode coverage (available) | ~100% | ~100% | 89% | — |
| Barcode coverage (unavailable) | **9%** | 28% | 87% | — |

### Freshness (`scraped_at`)

| | <1d | 1–7d | 7–30d | 30–90d | >90d | never |
|---|---|---|---|---|---|---|
| Continente | 8,490 | 6,917 | 953 | **45,492** | 7,793 | 0 |
| Auchan | 13,379 | 9,641 | 221 | 13,197 | **12,314** | 8 |
| Pingo Doce | 4,174 | 3,105 | 136 | 1,856 | 1,487 | 647 |

- **52,889** unavailable products not re-checked in 30+ days (zombie graveyard, no resurrection loop).
- **29,250** *available* products not scraped in 30+ days — their "current price" shown to users is stale.
- Only **8,951 distinct products** received a price point in the last 7 days (~12% of available catalog).
- Weekly price-row collection is **declining**: ~28k/week (Feb) → ~10k/week (Jun).

### Priority distribution (the intelligence layer's input)

| Priority | Count | Source |
|---|---|---|
| NULL (never prioritized) | **41,804 (32%)** | — |
| 0 (parked/never scrape) | 1,696 | manual/category/null |
| 1 (bi-weekly — **never scheduled**, see §3) | 29,587 | category_default (11 ai) |
| 2 | 17,508 | category_default |
| 3 | 3,429 | category_default |
| 4 | 13,276 | category_default |
| 5 | 22,510 | category_default |

### Data quality

- **41,256** products with NULL/zero price; **40,712** with NULL category.
- Duplicate barcodes within the same store: Continente 6 groups, Auchan 22, **Pingo Doce 164 (427 rows)**.
- ~24,882 products have `last_http_status=200` but `available=false` — candidate false-zombies worth sampling.
- Statuses 471/474 (internal sentinel codes) account for 29.5k unavailable products.
- Cross-store canonical coverage: of 65,225 canonical products, only **7,561 in 2 stores + 4,008 in 3 stores (17.7%)** — the "compare across supermarkets" promise currently works for a thin slice.
- 1,506 available products have **zero price history rows**.

### Platform limits

- **DB size: 394MB of 500MB free-tier cap (79%)** — at current `prices`/`scrape_runs` growth this becomes an incident within months.
- `scrape_runs` alone is 94,719 rows / 18MB and grows ~700 rows/day with no retention policy.
- Daily scrape failure rate is a consistent ~9% (≈2,400/day) — never triaged because the health watchdog is dead.

### Users (reality check)

- 11 profiles, 134 favorites, 2 alert subscriptions, **0 alert events ever**, 1 shopping list, 0 shopping list items, 0 achievements.
- Implication: you have near-total freedom to change schema/UX without migration pain. Optimize for the next 1,000 users, not the current 11.

---

## 2. TOPIC: Revive the dead automation (P0 — do this first)

The "one afternoon, massive leverage" cluster. Everything here is config/wiring, not new features.

### 2.1 Fix the cron 401s
- [ ] Add `/api/admin/price-stats-worker` and `/api/admin/alerts/scrape-health` to the middleware cron allowlist (`src/lib/supabase/middleware.ts:46`) — or better, replace the hardcoded list with a single rule: any request bearing a valid `Bearer ${CRON_SECRET}` bypasses admin auth.
- [ ] Verify in Vercel logs after next cron tick that both routes return 200.
- [ ] Confirm `price_stats_updated_at` starts populating (`SELECT count(*) FROM store_products WHERE price_stats_updated_at IS NOT NULL`).
- [ ] Add route-level `CRON_SECRET` check to `compute-worker` (it currently relies on middleware bypass only — defense-in-depth gap, and the only reason it *works* while its siblings 401).

### 2.2 Re-schedule discovery + triage
- [ ] Restore discovery crons in `vercel.json` (weekly per-origin runs existed before removal — `git show 0822ab0 -- vercel.json` has the exact schedules).
- [ ] Add triage cron (e.g. `/api/admin/discovery/triage?batch=80` every 2h, as before).
- [ ] First manual run: expect a large backlog after ~2.5 months of catalog drift; run discovery per-origin manually and watch `discovery_runs`.
- [ ] Decide and document *why* the crons were removed (egress crisis in March?) — if the constraint still exists, solve the constraint (see §7) instead of leaving discovery dead.

### 2.3 Re-enable P1 scheduling
- [ ] `src/lib/business/priority.ts:11-15` — `ACTIVE_PRIORITIES = [5,4,3,2]` with a "restore by ~20 Mar 2026" comment. Either restore P1 or formally redefine the tier system. 29,587 products sit in this tier and are never scraped.
- [ ] Audit all "temporary egress reduction" comments in `priority.ts` and `qstash/client.ts` and revert/ratify each one explicitly.

### 2.4 Wire the watchdog so this never happens again
- [ ] Once scrape-health cron works, make it also assert: "every cron route in `vercel.json` returned 2xx within its expected window" (cron-watching-the-crons). A simple `scrape_runs`-style `cron_runs` heartbeat table or a check against recent `analytics_snapshots`/`price_stats_updated_at` timestamps is enough.
- [ ] Make scrape-health alert on: discovery silence > 10 days, price-stats silence > 2 days, weekly price-row count dropping > 30% vs 4-week average (this would have caught the Feb→Jun decline).
- [ ] Hook the alert webhook to something you actually read (email/Telegram/Discord).

---

## 3. TOPIC: The intelligence layer (volatility-aware tracking)

This is the differentiator you described ("milk daily, Lego monthly"). The schema and most plumbing exist; production has literally zero of it computed.

### 3.1 Get volatility data flowing (depends on 2.1)
- [ ] After the 401 fix, backfill: run `price-stats-worker` manually with high batch counts until `candidate_ids` drains (~73k available products).
- [ ] Verify `price_drop_smart_score` populates and the deals/“smart drop” surfaces start using it.

### 3.2 Volatility-aware *cadence*, not just queue ordering
- Current state: volatility (`price_stats_cv_ln_90d`) only gives an **urgency boost** in the scheduler sort (`scheduler/route.ts:215-218`). The check *interval* is still a static per-priority table (`PRIORITY_REFRESH_HOURS`).
- [ ] Design doc (short): effective_interval = f(priority, volatility, user signal). E.g. interval multiplier 0.5x for top-quartile CV, 2x for bottom-quartile with ≥N observations.
- [ ] Implement in scheduler's overdue query (keep it server-side / RPC to respect egress).
- [ ] Feed user signal into priority: favorites already bump priority via trigger (`update_store_product_priority_on_favorite`); extend to product views and shopping-list adds.
- [ ] Add a `tracking rating` explainer on the product page ("we check this product every X because Y") — this is the "super intelligence" made visible and is a brand differentiator.

### 3.3 Priority assignment debt
- [ ] **41,804 NULL-priority products (32%)** — run governance audit (`/api/admin/discovery/triage` audit mode) to assign category defaults to everything mappable.
- [ ] Schedule the AI priority classifier (`/api/admin/scrape/ai-priority`) as a cron or QStash chain for products that remain NULL after category defaults (only 11 products ever got AI priority).
- [ ] Fix or delete `get_unsynced_high_priority_products` (`products.ts:928` — `TODO: fix this because sync job is not correct`; currently dead code).
- [ ] Fix analytics `capacity_calc` (migration 037 lines 252–255) — it only sums P5+P4 demand, so the capacity KPI shows a false surplus. Align with `ACTIVE_PRIORITIES`.
- [ ] Resolve the staleness metric mismatch: analytics uses `scraped_at`, scheduler uses `updated_at`. Pick semantics per use-case and document.

### 3.4 The savings story (the actual product promise)
- [ ] Define the "perfectly timed vs badly timed" delta metric per product/category from `prices` history — this is your marketing number and the core of "show them their savings".
- [ ] Surface per-user savings: favorites' price drops captured, alerts that fired, "you'd have saved €X buying on the right day".
- [ ] Make `SavingsTab`/achievements compute from real data (currently 0 achievements, savings tab fetches with raw `useEffect`).

---

## 4. TOPIC: Data integrity & dataset healing

### 4.1 Zombie lifecycle (unavailable ⇄ available)
- Current revival is narrow: 50/run, favorites first, then P4/P5 *with barcode*, untouched in 3 days (`scheduler/route.ts:128-168`). Result: 52,889 zombies never re-checked in 30+ days.
- [ ] Add a low-rate "graveyard sweep" lane to the scheduler: oldest-`scraped_at` unavailable products, all priorities, e.g. 100–200/day. Cheap, bounded, heals the graveyard in months.
- [ ] Sample the **24,882 `status=200 but available=false`** cohort (50 products, manually or scripted) — determine whether these are true out-of-stock or a soft-404 misclassification bug per store. Fix detection if the latter.
- [ ] Define zombie terminal state: unavailable + 404 for >N months → archive/veto (free DB space, declutter search). Currently nothing ever dies permanently.
- [ ] Wire `getUnavailableForRetry()` and `getFailedLastScrape()` helpers (exist, unused) or delete them.
- [ ] Add auto-heal for "phantom" products (`get_phantom_scraped_products` RPC exists; admin UI shows them; nothing fixes them).
- [ ] Fix the revival favorites subquery 1000-row cap (`scheduler/route.ts:133-141` — unpaginated `user_favorites` fetch).

### 4.2 Product identity, duplicates, replacements
- The "discontinued M&Ms replaced by same-but-different-barcode product" problem. Today: no successor linking at all.
- [ ] Schedule the canonical pipeline (`pnpm canonical:run` → QStash/cron weekly) — it's mature but manual, and coverage is stuck at 17.7% cross-store.
- [ ] Run Pass 1.5 (Open Food Facts enrichment) + Pass 2 (similarity clustering) on the backlog; review `split-suspects`.
- [ ] Clean the 192 duplicate-barcode groups (Pingo Doce-heavy: 164 groups) — likely same product under multiple URLs; merge or veto.
- [ ] Design "successor" linking: when a product goes terminally unavailable and a high-similarity product (same brand/size/category, new barcode) appears in discovery, propose a link so price history continues for the shopper. (Start as an admin review queue, not auto-merge.)
- [ ] Enrich barcode coverage for the 4k/3.2k unavailable-with-barcode imbalance — zombies without barcode (Continente: 91% of zombies) can never be canonically matched; factor this into the archive decision in 4.1.

### 4.3 Category normalization
- [ ] 40,712 NULL-category products — how many are zombies vs active? Backfill active ones via re-scrape/triage; let archive policy handle dead ones.
- [ ] `products.ts:138` FIXME — search filters on L1 `category` only; wire canonical categories into search/browse filters.
- [ ] Continue category mapping governance (2,645 mappings exist; `get_category_mapping_stats` shows coverage) — set a coverage target (e.g. >95% of available products mapped).

### 4.4 Database growth & retention (free tier: 500MB)
- [ ] **At 394MB/500MB now.** Decide: prune vs upgrade vs both — this is a strategic call (Pro is $25/mo and removes egress anxiety that has been silently shaping engineering decisions since March).
- [ ] `scrape_runs` retention: keep 30–60 days, aggregate older into a daily rollup (saves ~15MB+ and growing).
- [ ] `store_products` is 204MB with 129k rows — check TOAST/index bloat; archiving terminal zombies (4.1) is the big lever.
- [ ] Re-check `prices` dedup: consecutive identical price points should be collapsed by `upsert_price_point` — verify with a sample query, since 340k rows for this scrape volume seems right, but confirm no drift.

---

## 5. TOPIC: Security & platform hygiene

### 5.1 Critical: anon can write to your dataset
Supabase advisors flag RLS policies that make the **public anon key** able to corrupt the core dataset:
- `prices`: INSERT/UPDATE/DELETE allowed for `anon` with `true` policies (including a `DELETE ... USING (true)`!).
- `store_products`: INSERT/UPDATE allowed for `anon` with `true` policies.
- `scrape_runs`: anon INSERT.

For a product whose entire value is *data integrity*, this is the top security item: anyone who reads the anon key out of the client bundle can silently poison or delete price history.
- [ ] Move all scraper/engine writes to the service-role client (they likely already use `createAdminClient`) and **drop anon/authenticated write policies** on `prices`, `store_products`, `scrape_runs`.
- [ ] Test the app + workers afterwards (favorites/product views have their own scoped policies and should be unaffected).
- [ ] Revoke anon EXECUTE on `compute_analytics_snapshot` and `refresh_store_product_price_stats_batch` (currently callable by anyone via REST RPC — free-tier DoS / data-skew vector).

### 5.2 Advisor cleanup (mechanical, batchable)
- [ ] `auth_rls_initplan` warnings (~20 policies): wrap `auth.uid()` as `(select auth.uid())`.
- [ ] Set `search_path` on the ~30 flagged functions (one migration).
- [ ] Move `pg_trgm`, `unaccent` extensions out of `public`.
- [ ] Add policy or drop RLS-enabled-no-policy on `supermarkets`.
- [ ] **Upgrade Postgres** (15.8.1.034 has outstanding security patches).
- [ ] Enable leaked-password protection; reduce OTP expiry (<1h).
- [ ] Add missing FK indexes (`prices.supermarket_product_id` legacy FK — or drop the legacy column entirely).

### 5.3 Pipeline robustness bugs (from code audit)
- [ ] `discovery/route.ts:88,126,182,209` — `saveDiscoveryRun(...).catch(() => {})` silent failures; log at minimum.
- [ ] `updatePricePoint` RPC errors are logged but swallowed — surface failure to the batch-worker so `scrape_runs.failed` reflects reality (today's "9% failure" may be understated).
- [ ] Fix legacy `/api/admin/cron` QStash **double-JSON-encoding** bug (or delete the legacy `worker` path entirely and standardize on `batch-worker`).
- [ ] Delete dead code: `updatePricePointLegacy`, legacy `Scrapers.*.productPage` compat object, `crawlContinenteCategoryPages`, `getStaleByPriority` (dev-only divergent thresholds).
- [ ] Fix stale comments (scheduler says "every 15 min", QStash says "reduced to 10") — they actively mislead future debugging.

---

## 6. TOPIC: Frontend, mobile & PWA

Mobile is the #1 form factor and your stated biggest worry. Verdict from the audit: **core flows (search, PDP, scan, favorites, deals) are genuinely good** — the sloppiness is in the edges: error handling, deep links, i18n leaks, and bundle weight.

### 6.0 Broken working tree (fix before anything)
- [ ] `src/app/layout.tsx` imports `./global.css` but the file is `globals.css` — **the build is currently broken locally**. Revert the import (or rename the file).
- [ ] Finish + commit the in-flight MiniProductCard refactor (move to `src/components/products/` is correct and ~done):
  - [ ] Align skeleton spacing with the real card (`mt-0.5`/`gap-y-0.5` vs skeleton `mt-1`/`gap-y-1.5`; conditional price-per-unit row).
  - [ ] Commit Header/FavoritesLink/badge changes as one unit; run `pnpm check`.

### 6.1 P0 user-visible bugs
- [ ] **`/profile?tab=alerts` does nothing** — dashboard links to it (`PersonalizedDashboard.tsx:95,133`) but `profile/page.tsx:53` hardcodes `defaultValue="favorites"` and ignores `searchParams.tab`.
- [ ] `useUserAlerts.ts:26-27` — fetch failure returns `[]`, indistinguishable from "no alerts" (violates your own error-handling rule).
- [ ] Onboarding store picks are never persisted (`onboarding/page.tsx:44-54`) — persist to profile or cut the step.
- [ ] `useFavorites.tsx:138-143,183-188` — toggle failures silently swallowed (`.catch(() => false)`), no toast.

### 6.2 Route resilience (per your error-handling rule)
- [ ] Add `error.tsx`: `/` (home fetches stats + hero), `/products/barcode/[barcode]`, `/products/compare`, `/login`.
- [ ] Add `loading.tsx`/Suspense for `/products/compare`, `/onboarding`.
- [ ] Delete `/identical` redirect route's stale `error.tsx`/`loading.tsx` (or the whole route).
- [ ] Eliminate the double skeleton flash on home for logged-in users (`HomeContent.tsx:17` route-Suspense → auth-skeleton chain).

### 6.3 Mobile/PWA polish
- [ ] Manifest: `"lang": "en"` → `pt`; localize app shortcuts (`site.webmanifest`).
- [ ] Search dialog: adopt `overlayVisualViewportSync` (barcode scanner already does it) — iOS keyboard gap.
- [ ] `onboarding/page.tsx:67`: `min-h-screen` → `min-h-dvh`.
- [ ] Reconsider bottom-nav hide-on-scroll (`BottomNav.tsx:29-37`) — scan/search disappear exactly when browsing long lists.
- [ ] Revisit `maximumScale: 1` (a11y: blocks pinch-zoom).
- [ ] Verify standalone-PWA safe-area behavior on a real installed device (`BottomNav.tsx:36`, `MainLayout.tsx:24` have a suspicious env() comment).
- [ ] Empty catch in `BarcodeCompare.tsx:278-279` (OFF fetch) — log + show degraded state.

### 6.4 i18n (pt-PT first)
- [ ] `StoreProductsShowcase.tsx` (~611–658): hardcoded English filter chips ("On sale", "Search: …").
- [ ] `MobileFiltersDrawer.tsx:212-237`: "Any price", "All stores", "Any brand".
- [ ] `ProductGridLoadingSkeleton.tsx:10`: "Search products...".
- [ ] `InflationTrends` on `/about`: English chart copy.
- [ ] `ProductChart.tsx:696` hardcodes `pt-PT` even for `en` users — use resolved locale.

### 6.5 Performance / maintainability
- [ ] Split the three mega client files: `StoreProductsShowcase.tsx` (1334 lines), `ProductChart.tsx` (1254 — lazy-load recharts via `next/dynamic`), `FavoritesShowcase.tsx` (1155).
- [ ] Migrate `ListsTab`/`SavingsTab` from raw `useEffect`+`fetch` to TanStack Query hooks (your own data-fetching rule).
- [ ] `ListsTab.tsx:91-122` mutations don't check `res.ok` — silent failures.

### 6.6 Native-feeling mobile (strategic)
You called the NextJS-first start "a big crutch". Before any rewrite:
- [ ] Squeeze the PWA: the scanner is already best-in-class; fix 6.1/6.3 and instrument installs (`PWAInstallPrompt` events) to measure how far PWA can carry you.
- [ ] Only then evaluate a thin native shell (Capacitor/Expo WebView) vs true native — a decision doc, not code. The engine and API surface stay identical either way, so nothing in this health check is wasted by the choice.

---

## 7. TOPIC: Strategic / business decisions (needed to unblock engineering)

These are owner-level calls that engineering tasks above keep tripping over:

- [ ] **Supabase tier decision.** The March egress crisis caused: P1 disabled, batch caps reduced, discovery removed — i.e. the free tier has been silently degrading the product for 3 months. €25/mo for Pro (8GB DB, 250GB egress) removes the constraint that caused most of the rot. Decide and either upgrade or codify the constraints as permanent design inputs.
- [ ] **Define "healthy catalog" SLOs.** E.g.: P5 fresh <24h ≥95%; available-but-stale-30d <2%; zombie re-check ≤30d; discovery weekly; cross-store coverage ≥40% of top-1000 products. The scrape-health watchdog (2.4) then enforces these instead of vibes.
- [ ] **Subscription readiness is a D today** (placeholder pricing, `profiles.plan` unused, no Stripe). Don't build billing yet — but decide what Plus *is* (alerts? volatility insights? history depth?) so the intelligence-layer work in §3 lands behind the right boundaries.
- [ ] **Alert events = 0 forever.** Decide whether email alerts are a launch feature; if yes, prove the pipeline end-to-end with your own account and a price-drop fixture; if no, hide the UI until they work (anti-"shipped but fake" principle).
- [ ] **El Corte Inglés (origin 4)** exists in the DB with no scraper — remove or roadmap it; ghosts confuse analytics.

---

## 8. TOPIC: Engineering hygiene & tests

- [ ] **Orchestration-layer tests are near zero** while it's the part that actually runs production: add integration tests for scheduler urgency/revival, `scrapeAndReplaceProduct` (404 → markUnavailable → close price point), `upsert_price_point` behavior, triage keep/park/veto. (Scraper HTML parsing is already well-tested — keep that pattern.)
- [ ] Add a CI check that `vercel.json` cron paths ⊆ middleware allowlist (or remove the allowlist coupling entirely per 2.1) — this class of bug should be impossible to reintroduce.
- [ ] `pnpm check` green on main; commit or shelve the current WIP (6.0).
- [ ] Prune dead routes/components flagged in §5.3 and §6.2.
- [ ] Set up a Log Drain or lightweight cron-result persistence — 24h log retention is how the 401s went unnoticed for months.

---

## 9. Suggested execution order

**Phase 0 — "turn the machines back on" (hours, not days)**
1. Fix `global.css` import; commit WIP (6.0)
2. Middleware cron allowlist fix + verify 200s (2.1)
3. Restore discovery/triage crons (2.2)
4. Re-enable P1 / ratify egress reductions (2.3) — gated on the Supabase tier decision (§7)
5. Backfill price-stats (3.1)

**Phase 1 — "stop the bleeding" (1–2 weeks of small PRs)**
6. RLS anon-write lockdown (5.1) + advisor batch (5.2)
7. Watchdog hardening + alerting channel (2.4)
8. Frontend P0 bugs (6.1) + route error boundaries (6.2)
9. `scrape_runs` retention + DB size plan (4.4)
10. NULL-priority backfill via governance audit + AI classifier cron (3.3)

**Phase 2 — "heal the dataset" (ongoing background lanes)**
11. Graveyard sweep + false-zombie sampling + terminal-archive policy (4.1)
12. Canonical pipeline scheduled + duplicate-barcode cleanup (4.2)
13. Category backfill + search on canonical categories (4.3)

**Phase 3 — "become the intelligence layer" (the differentiator)**
14. Volatility-aware cadence (3.2)
15. Savings delta metric + user-facing savings story (3.4)
16. Successor-product linking (4.2)
17. i18n + mobile polish + mega-component splits (6.3–6.5)
18. Plus-tier definition → alerts proven → billing (§7)

---

## Appendix: queries used for the production audit

Re-runnable any time to track progress (all aggregate, egress-cheap):

```sql
-- Freshness buckets per store
SELECT origin_id,
  count(*) FILTER (WHERE scraped_at > now()-interval '1 day') AS fresh_1d,
  count(*) FILTER (WHERE scraped_at <= now()-interval '30 days') AS stale_30d
FROM store_products GROUP BY 1;

-- Zombie graveyard
SELECT count(*) FROM store_products
WHERE available=false AND scraped_at < now()-interval '30 days';

-- Volatility layer liveness
SELECT count(*) FILTER (WHERE price_stats_updated_at IS NOT NULL) AS with_stats,
       max(price_stats_updated_at) AS last_update
FROM store_products;

-- Weekly price collection trend
SELECT date_trunc('week', created_at)::date AS week, count(*)
FROM prices WHERE created_at > now()-interval '120 days'
GROUP BY 1 ORDER BY 1;

-- Cross-store identity coverage
SELECT store_count, count(*) FROM canonical_products GROUP BY 1;

-- DB size vs 500MB cap
SELECT pg_size_pretty(pg_database_size(current_database()));
```
