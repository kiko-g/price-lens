# Price Lens

Price tracking app for Portuguese supermarkets built with Next.js 16, React 19, Supabase, and TailwindCSS.

## Essentials

- **Package manager**: pnpm (not npm)
- **Imports**: Use `@/` alias (e.g., `@/components/`, `@/lib/`, `@/hooks/`)
- **Verify changes**: `pnpm check` (runs tsc, lint, build)
- **Run tests**: `pnpm test:run`

## Detailed Guidelines

See `.cursor/rules/` for context-specific rules:

- [Front-end conventions](.cursor/rules/front-end-cursor-rules.mdc) - React/Next.js patterns, naming, accessibility
- [Hydration safety](.cursor/rules/hydration-safety.mdc) - Prevent server/client HTML mismatches (Date.now, Math.random, locale)
- [Error handling](.cursor/rules/error-handling.mdc) - No empty catches, no silent failures, required error.tsx boundaries
- [Skeleton loading](.cursor/rules/skeleton-loading.mdc) - Skeleton dimensions must match real components; skeletons in own files
- [Data fetching](.cursor/rules/data-fetching.mdc) - TanStack Query for client data, useEffect only for side effects, server fetch cache intent
- [Performance](.cursor/rules/performance.mdc) - Small client boundaries, no barrel exports, lazy-load heavy components
- [Database and business logic](.cursor/rules/supabase.mdc) - Supabase and business logic rules. Essential for understanding limitations and the barebone layer of Price Lens.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron context (Pro plan).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan and cron configuration.
- [Vercel deployment](.cursor/rules/vercel.mdc) - Vercel Pro plan, cron jobs.
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro, crons, deployment
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron plan (Pro)
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Pro plan).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Pro plan).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Vercel Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro, crons, deployment
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan and cron limits.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan and cron configuration.
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro plan, cron jobs, deployment.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro), cron configuration.
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro plan, crons, deployment context.
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro plan, crons, deployment.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan and cron assumptions.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan and cron constraints.
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro, crons, deployment
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron jobs (Pro plan).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro), cron configuration.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Pro plan).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro) and cron behavior.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro), cron limits, infrastructure assumptions.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro), cron capabilities
- [Vercel](.cursor/rules/vercel.mdc) - Vercel Pro plan, cron configuration
- [Vercel](.cursor/rules/vercel.mdc) - Deployment, crons, plan (Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Vercel Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron plan (Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro), cron configuration.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment plan (Pro) and cron expectations.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment, crons, plan.
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron plan (Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron plan (Pro).
- [Vercel](.cursor/rules/vercel.mdc) - Deployment and cron configuration (Pro plan).
