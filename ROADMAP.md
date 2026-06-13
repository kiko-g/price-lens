# Price Lens — Scrape Economy Roadmap

> Companion to `HEALTH_CHECK.md`. That document lists *what is broken*; this one answers the strategic question: **how do we track a 200k-product catalog with volatility-awareness, recovery, discovery and triage — without blowing the Vercel compute budget or the Supabase 500MB/5GB free-tier limits?**
>
> Everything below is grounded in production numbers pulled 2026-06-12.

---

## 1. The capacity math (read this first — it dispels the fear)

The anxiety driving "P1/P0 must stay locked" assumes demand far exceeds capacity. The real numbers, **counting only `available=true` products** (the scheduler already filters out unavailable ones):

### Supply

| | Value |
|---|---|
| Theoretical ceiling | 40 products/batch × 20 batches/run × 48 runs/day = **38,400/day** |
| Observed throughput (last 14 days) | **~27,000/day** (~9% item failures included) |

### Demand at nominal cadence (available products only)

| Priority | Available products | Cadence | Scrapes/day |
|---|---|---|---|
| P5 | 17,895 | 24h | 17,895 |
| P4 | 9,770 | 48h | 4,885 |
| P3 | 2,527 | 72h | 842 |
| P2 | 12,893 | 7d | 1,842 |
| **Active subtotal** | 43,085 | | **25,464** |
| P1 (locked) | 26,906 | 14d | **+1,924** |
| P0 + NULL (available) | ~3,000 | — | one-time triage |

### Three conclusions that reframe everything

1. **Unlocking P1 costs only ~1,924 scrapes/day — about 7% of current throughput.** A 14-day cadence over 27k products is cheap *because the cadence is long*. The total demand with P1 enabled (~27.4k/day) fits inside the observed 27k throughput almost exactly, and well inside the 38.4k ceiling.
2. **The real budget hog is P5: 17,895 products at daily cadence = 70% of all demand.** The system is saturated not because the catalog is too big, but because the top tier is too fat.
3. **A large share of P5/P4 never changes price.** In the last 90 days, of available products: ~31% of P5 (5,543) and ~37% of P4 (3,569) had **zero price-change events**; another ~10% had at most one. (Caveat: this pool conflates "stable" with "not scraped lately" — the volatility stats below separate them.) Demoting provably-flat P5s to 48h frees **~2,000–3,000 scrapes/day** — more than enough to fund P1, recovery, and triage *combined*.

> **The strategic unlock is not "find budget for the long tail." It is "make the head of the catalog earn its cadence."** Volatility data pays for everything else.

---

## 2. The core mechanism: a budgeted scrape economy with lanes

Today the scheduler has one implicit lane (overdue actives by urgency) plus a small hardcoded revival side-channel. Replace this with an **explicit daily budget split into lanes**. The budget is a constant you control; the lanes guarantee that healing and the long tail *always* get a trickle, instead of being starved by the head.

```
DAILY_SCRAPE_BUDGET = 28,000        (tune against Vercel fluid compute bill)

Lane A — SLA lane          ~80%  (22,400/day)  P5..P2 due products, urgency-sorted (current behavior)
Lane B — Healing lane      ~10%  (2,800/day)   zombie graveyard sweep, phantom products, failed-scrape retries
Lane C — Long-tail lane    ~10%  (2,800/day)   P1 round-robin + triage of discovery skeletons
```

Per scheduler run (every 30 min, 48 runs/day) that is simply: ~470 slots Lane A, ~58 Lane B, ~58 Lane C. Implementation is three queries with separate limits instead of one — no new infrastructure, same QStash flow.

### Why lanes solve your problem

- **P1 stops being a binary unlock.** Lane C guarantees the long tail cycles at *whatever rate the budget allows*. 26,906 P1 products ÷ 2,800/day ≈ full cycle every 10 days — better than the nominal 14-day SLA, at 10% of budget. If budget tightens, the cycle stretches to 20 or 30 days but **never stops**.
- **Zombies finally heal.** 52,889 never-rechecked unavailable products ÷ ~2,000/day ≈ graveyard fully swept in ~1 month, then steady-state re-check every ~30–45 days. Recovered products re-enter Lane A automatically (scrape success flips `available=true`).
- **Discovery/triage becomes a drip, not a flood.** Discovery inserts skeletons (cheap, see §5); Lane C triages them at a bounded rate. No separate compute spike.
- **The budget is one number you can turn** when the Vercel bill or Supabase egress moves. Nothing else needs rethinking.

---

## 3. Volatility-earned cadence (the proven heuristic you asked for)

### Principle

**A product's check frequency must be earned by observed price movement.** Static priority sets a *floor and ceiling*; volatility moves the product within that band. This is self-correcting, cheap to compute (already built — `refresh_store_product_price_stats_batch`), and explainable to users ("we check milk daily because its price moved 6 times this quarter").

### Concrete rules (v1 — deliberately simple and provable)

Let `cv = price_stats_cv_ln_90d`, `obs = price_stats_obs_90d` (number of price-change events in 90d), and `checked = scraped_at` recency (proves the product was actually being watched, not just quiet because we never looked).

**Effective interval = PRIORITY_REFRESH_HOURS[p] × volatility multiplier:**

| Condition | Multiplier | Effect on a P5 (24h) |
|---|---|---|
| `obs ≥ 4` and high cv (top quartile) | ×0.75 | ~18h |
| `obs ≥ 2` (some movement) | ×1.0 | 24h (unchanged) |
| `obs ≤ 1` over a *fully watched* 90d window | ×2.0 | 48h |
| `obs = 0` over *two consecutive* fully-watched windows | demote one priority level (`priority_source` stays, log the demotion) | becomes P4 |

**Promotion (the safety valve):** any price-change event on a demoted product immediately restores its original tier for the next 90d window. Favorites/views/list-adds also force promotion regardless of volatility (user signal > statistics). This bounds the worst case: a demoted product that starts moving is caught at most one stretched-interval late, then tracked tightly again.

**Cold-start (P1/NULL products with no history):** inherit the **category-level volatility prior** — median cv of products in the same canonical category (a single GROUP BY to maintain). New/long-tail products in volatile categories (fresh produce, dairy) start at the fast end of their band; stable categories (cleaning, toys) start slow. This solves the chicken-and-egg of "we need observations to know how often to observe."

### Why this is safe to ship

- It only *stretches* intervals on products with proven flatness and *shrinks* them where movement is proven — net scrape demand goes **down**, not up.
- All inputs already exist as denormalized columns; the scheduler query just multiplies the threshold. No new tables.
- Every demotion/promotion is loggable → you can audit the heuristic with one SQL query and revert by zeroing multipliers.

### Pre-requisite (currently broken!)

The volatility columns are **0% populated** because `/api/admin/price-stats-worker` is 401-blocked by the middleware cron allowlist (`src/lib/supabase/middleware.ts:46` — see HEALTH_CHECK §2.1). **This fix is the first domino: no volatility data → no economy.** As of the latest commits this is still unfixed.

---

## 4. Recovery, discovery, triage — fluid and bounded

### Recovery (Lane B, ~2,800/day)

Priority order within the lane:
1. **Favorited/viewed unavailable products** (user signal, current "smart revival" logic — keep, but fix the 1000-row favorites cap).
2. **Failed-last-scrape retries** (transient 5xx) — currently never retried explicitly.
3. **Phantom products** (`get_phantom_scraped_products` — scraped but no price) — re-scrape, then auto-park if still phantom.
4. **Graveyard sweep**: oldest `scraped_at` first among `available=false`, no barcode requirement (the current barcode filter excludes 91% of Continente zombies).

**Terminal-state rule (keeps DB bounded):** unavailable + every re-check failed for **180 days** → archive (delete row, keep barcode/URL in `vetoed_store_skus`-style table or a compressed archive). Zombies then cost at most ~6 re-checks before exiting the system forever.

### Discovery (weekly cron, nearly free)

- Sitemap fetches hit the *vendors*, not Supabase — no egress concern. Inserts are skeleton rows (~1.6KB each).
- Restore the per-origin weekly crons that were deleted from `vercel.json` (schedules preserved in git history, commit `0822ab0`).
- Cost: one Vercel invocation per store per week + a few MB of DB per thousand genuinely-new products. Bounded by `vetoed_store_skus` dedup (46k vetoes already filter re-discovery).

### Triage (Lane C drip)

- Skeletons get scraped once via Lane C (keep/park/veto). At ~1,000/day within the lane, even a 10k-product discovery backlog clears in ~10 days.
- Veto deletes the row (DB-neutral); park costs nothing further; keep enters the economy with a category-prior cadence.

---

## 5. Living inside the limits

### Supabase 500MB (currently at 394MB — the most urgent ceiling)

The scrape volume itself barely grows the DB — `prices` only inserts on change (~10k rows/week ≈ 1.5MB/week). The real levers:

| Action | Est. recovery | Effort |
|---|---|---|
| `scrape_runs` retention: keep 60d raw, daily rollup older (94,719 rows / 18MB and growing ~700/day) | ~12–15MB now, caps growth | one cron + one migration |
| Archive terminal zombies (§4 rule applied to the existing 52,889 backlog after one sweep cycle) | **~40–80MB** (store_products is 204MB for 130k rows; zombies are ~44% of rows) | the biggest lever |
| Drop unused indexes flagged by advisors (product_views, discovery_runs, etc.) | ~1–3MB | trivial |
| `VACUUM`/bloat check after the archive pass | unknown, possibly significant | trivial |

Target: **back under ~300MB with a year of headroom.** If after all this you still trend toward the cap, that's the moment to pay for Supabase Pro — but you likely don't need to today.

### Supabase 5GB/month egress

- The scheduler reads ~800 slim rows per run (id/url/priority/timestamps) — ~5MB/day. Fine.
- Keep all heavy logic in RPCs (already the pattern: `upsert_price_point`, price-stats, analytics).
- **Instrument before constraining**: add an egress estimate to the daily analytics snapshot (Supabase dashboard numbers, or sum of response sizes in the API layer). The March crisis was solved blind (P1/P2 paused, batches halved) — never let an invisible metric drive product decisions again.

### Vercel Pro fluid compute

- Batch-worker wall-time is dominated by anti-block *sleeps* — under Fluid compute, idle wait is billed as provisioned memory (cheap), not active CPU. The configuration that matters is invocation count and memory size, not the delays.
- 27k products/day = ~675 worker invocations/day at ~4 min each. If the bill needs trimming: bigger batches (60–80/invocation within the 300s limit) cut invocation overhead ~40% without reducing throughput.
- Crons themselves are trivial (4–8 invocations/day each for discovery/stats/health).
- **Task:** pull the actual fluid-compute usage from the Vercel dashboard once, set `DAILY_SCRAPE_BUDGET` against it, and add it to the scrape-health alert thresholds.

---

## 6. Build order (each phase is small, shippable, and unblocks the next)

### Phase 0 — Turn the intelligence back on ✅ *(completed 2026-06-13)*
1. ✅ Middleware cron fix: hardcoded path allowlist replaced with a generic `Bearer ${CRON_SECRET}` bypass for all `/api/*` (`src/lib/supabase/middleware.ts`). Route-level `CRON_SECRET` check added to `compute-worker`.
2. ✅ Price-stats backfill drained directly against production via RPC: **32,270 products** now have volatility stats (24,628 with non-zero cv, 8,276 with smart scores). Remaining ~40k available products have no price observations in 90d (stale cohort) — they gain stats automatically as scraping touches them.
3. ✅ Discovery (weekly per-origin, Sun 03:00) + triage (2h, batch 80) crons restored in `vercel.json`.
4. ✅ Alerting: scrape-health now also sends email via Resend (`SCRAPE_ALERT_EMAIL`); default sender switched to `onboarding@resend.dev` (free tier, no domain). Env vars set in Vercel (`RESEND_API_KEY`, `SCRAPE_ALERT_EMAIL`).

**Post-deploy verification (first thing for the next session):**
- [ ] Vercel logs: `price-stats-worker` (:30 past every 12h), `scrape-health` (every 8h), `triage` (every 2h) return **200**, not 401.
- [ ] First Sunday 03:00: discovery runs appear in `discovery_runs` for all 3 origins.
- [ ] Trigger scrape-health manually (`curl -H "Authorization: Bearer $CRON_SECRET" <prod>/api/admin/alerts/scrape-health`) → alert email arrives (proves Resend chain).
- [ ] `SELECT max(price_stats_updated_at) FROM store_products` advances after each worker tick.

### Phase 1 — The lane economy *(one focused PR on the scheduler)*
5. Add `DAILY_SCRAPE_BUDGET` + per-run lane quotas (A/B/C) to `scheduler/route.ts`.
6. Lane B: generalize smart-revival into the healing order of §4 (drop the barcode requirement, fix the favorites 1000-row cap).
7. Lane C: P1 round-robin (oldest `scraped_at` first) + triage drip. **This effectively unlocks P1 at ~10% budget — no cadence promise, just guaranteed rotation.**
8. Log lane fill rates into `scrape_runs` (or a sibling table) so the allocation is observable.

### Phase 2 — Volatility-earned cadence *(after ~2 weeks of price-stats data)*
9. Apply the multiplier table (§3) in the Lane A staleness query.
10. Demotion/promotion job: piggyback on `price-stats-worker` (it already touches every product's stats; add the two-window-flat demotion + change-event promotion).
11. Category volatility priors (one materialized view or denormalized column on `canonical_categories`).
12. Surface it in the UI: "checked every X — price moved N times in 90 days" on the product page. *This is the Super-Intelligence made visible and costs nothing.*

### Phase 3 — Storage discipline *(parallel to Phase 2, all low-risk)*
13. `scrape_runs` rollup + retention cron.
14. Terminal-zombie archive rule + one-time backlog archive (after one full graveyard sweep gives every zombie a fair re-check).
15. Drop advisor-flagged unused indexes; VACUUM; re-measure DB size.
16. Egress + fluid-compute numbers into the analytics snapshot and health alerts.

### Explicitly deferred (don't touch until the above is stable)
- Dynamic per-product ML scheduling (the multiplier table is enough for 200k products).
- Native mobile app decision.
- Billing/subscriptions.
- New stores (El Corte Inglés).

---

## 7. How you'll know it's working (SLOs to watch weekly)

Run these against `analytics_snapshots` / SQL (all already cheap):

| Metric | Today | Target after Phase 2 |
|---|---|---|
| P5 fresh < 48h | unknown (analytics mismatch) | ≥ 95% |
| Available products unscraped > 30d | 29,250 | < 1,000 |
| Zombies unrechecked > 45d | 52,889 | ~0 (steady-state) |
| Products with volatility stats | **0** | ≥ 95% of available |
| P1 full-rotation time | ∞ (never) | ≤ 14 days |
| Discovery runs per month | 0 | ≥ 4 per store |
| DB size | 394MB | < 320MB and flat |
| Weekly price rows | ~10k and falling | rising toward ~15–20k (more products watched where it matters) |
