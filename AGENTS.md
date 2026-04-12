# Price Lens

Price tracking app for Portuguese supermarkets built with Next.js 16, React 19, Supabase, and TailwindCSS.

## Product context

- **Audience**: Shoppers in **Portugal** comparing prices across major chains; **mobile and PWA** are first-class.
- **Core flows**: Search, product detail & price history, **barcode scan**, favorites, deals/alerts.
- **Locales**: Prefer **`pt-PT`** for user-visible dates/numbers where the codebase sets an explicit locale (see hydration rules).

## Essentials

- **Package manager**: pnpm (not npm)
- **Imports**: Use `@/` alias (e.g., `@/components/`, `@/lib/`, `@/hooks/`)
- **Verify changes**: `pnpm check` (runs tsc, lint, build)
- **Run tests**: `pnpm test:run`

## AI / Cursor context

- **Always-applied rule**: [Product context](.cursor/rules/product-context.mdc) — what we’re building and who it’s for.
- **Mobile & PWA** (when editing `src/**/*.tsx`): [mobile-pwa-ux.mdc](.cursor/rules/mobile-pwa-ux.mdc)
- **Optional skill**: [.cursor/skills/mobile-and-pwa-verification/SKILL.md](.cursor/skills/mobile-and-pwa-verification/SKILL.md) — checklist before shipping keyboard/camera/modal work

## Detailed guidelines

See `.cursor/rules/` for context-specific rules:

- [Front-end conventions](.cursor/rules/front-end-cursor-rules.mdc) - React/Next.js patterns, naming, accessibility
- [Hydration safety](.cursor/rules/hydration-safety.mdc) - Prevent server/client HTML mismatches (Date.now, Math.random, locale)
- [Error handling](.cursor/rules/error-handling.mdc) - No empty catches, no silent failures, required error.tsx boundaries
- [Skeleton loading](.cursor/rules/skeleton-loading.mdc) - Skeleton dimensions must match real components; skeletons in own files
- [Data fetching](.cursor/rules/data-fetching.mdc) - TanStack Query for client data, useEffect only for side effects, server fetch cache intent
- [Performance](.cursor/rules/performance.mdc) - Small client boundaries, no barrel exports, lazy-load heavy components
- [Database and business logic](.cursor/rules/supabase.mdc) - Supabase limits, queries, and business context
- [Vercel](.cursor/rules/vercel.mdc) - Deployment, Pro plan, cron routes, `CRON_SECRET`, env vars
