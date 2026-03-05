---
name: add-analytics-kpi
description: Add new KPI metrics to the precomputed analytics dashboard. Use when adding, modifying, or removing analytics metrics, KPIs, or dashboard sections on the admin analytics page.
---

# Adding Analytics KPIs

The admin analytics page (`/admin/analytics`) reads from a precomputed `analytics_snapshots` table. A SQL function computes all KPIs and stores them as a JSONB blob. Adding a new KPI touches exactly three layers — no migrations needed.

## Architecture

```
compute_analytics_snapshot() → analytics_snapshots.data (JSONB) → GET /api/admin/analytics → page.tsx
```

- **SQL function**: `compute_analytics_snapshot()` in `scripts/migrations/024_analytics_snapshots.sql`
- **TypeScript types**: `src/types/analytics.ts` — `AnalyticsSnapshotData`
- **Frontend sections**: `src/app/admin/analytics/_components/analytics-sections.tsx`

## Steps to add a new KPI

### 1. Add the aggregation to the SQL function

Open `scripts/migrations/024_analytics_snapshots.sql`. Most counts come from the `sp_counts` CTE (single scan of `store_products`). Add your metric there when possible:

```sql
-- Inside the sp_counts CTE:
count(*) FILTER (WHERE your_condition)::INT AS your_metric,
```

If the metric needs a different table (e.g. `prices`, `trade_items`), add a new CTE rather than joining into `sp_counts`.

Then add it to the `jsonb_build_object(...)` output under the appropriate group key, or create a new group:

```sql
'your_group', jsonb_build_object(
  'your_metric', c.your_metric
),
```

### 2. Update the TypeScript type

Add the field to the matching group in `src/types/analytics.ts`:

```ts
your_group: {
  your_metric: number
}
```

### 3. Add the UI section

In `src/app/admin/analytics/_components/analytics-sections.tsx`, either add to an existing section or create a new exported section component following the pattern:

```tsx
export function YourSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  // ...
}
```

Then render it in `src/app/admin/analytics/page.tsx` inside the grid layout.

### 4. Re-apply the function locally and recompute

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f scripts/migrations/024_analytics_snapshots.sql
```

Then click "Recompute" in the UI or run:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT compute_analytics_snapshot('manual');"
```

## Key constraints

- **Use `PRIORITY_CONFIG`** from `src/lib/business/priority.ts` for anything priority-related. Never duplicate priority labels or colors.
- **Prefer adding to `sp_counts`** — this CTE already does a single full scan of `store_products`, so additional `FILTER` clauses are nearly free.
- **New CTEs are fine** for data from other tables (`prices`, `trade_items`, `canonical_products`). Cross-join them in the final SELECT.
- **Background compute** — the function runs every 12h or on manual trigger, so queries taking 10-30s are acceptable. Optimize for correctness, not speed.
- **No migration needed** — JSONB is schema-free. Old snapshots simply won't have new fields; the frontend must handle `undefined` gracefully (nullish coalescing).
