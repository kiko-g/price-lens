# Lince (aka Price Lens)

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
- **Installed skills** live in [`.agents/skills/`](.agents/skills/) and are pinned in [`skills-lock.json`](skills-lock.json). When a skill and a project rule disagree, follow the project rule (locale, supermarket badges, data fetching, Supabase limits, error handling).

### Design (Emil Kowalski)

All skills from [emilkowalski/skills](https://github.com/emilkowalski/skills). Use them for UI craft and motion. This app is a Next.js web/PWA, so prefer `emil-design-eng`, `mobile-native`, `animate`, `gestures`, `review-animations`, and `break-ui`. `ask-emil` routes to the right one. `animate-expo` and `write-swift` are installed for completeness; they apply only if we add Expo or Swift.

### Correctness, architecture, and bugs (Matt Pocock)

From [mattpocock/skills](https://github.com/mattpocock/skills), only the skills for those three jobs:

- **Correctness**: `tdd`, `code-review`
- **Architecture**: `codebase-design`, `improve-codebase-architecture`, `domain-modeling`
- **Finding bugs**: `diagnosing-bugs`
- **`grilling`** is included because `improve-codebase-architecture` interviews through it

Ticket workflow, triage, and productivity skills are not installed. `code-review` expects `/setup-matt-pocock-skills` for an issue-tracker doc; that setup skill is not installed. Point it at the spec or issue directly. `docs/*` is gitignored, so do not rely on committing files under `docs/agents/`.

## Detailed guidelines

See `.cursor/rules/` for context-specific rules:

- [Front-end conventions](.cursor/rules/front-end-cursor-rules.mdc) - React/Next.js patterns, naming, accessibility
- [Hydration safety](.cursor/rules/hydration-safety.mdc) - Prevent server/client HTML mismatches (Date.now, Math.random, locale)
- [Error handling](.cursor/rules/error-handling.mdc) - No empty catches, no silent failures, required error.tsx boundaries
- [Skeleton loading](.cursor/rules/skeleton-loading.mdc) - Skeleton dimensions must match real components; skeletons in own files
- [Data fetching](.cursor/rules/data-fetching.mdc) - TanStack Query for client data, useEffect only for side effects, server fetch cache intent
- [Performance](.cursor/rules/performance.mdc) - Small client boundaries, no barrel exports, lazy-load heavy components
- [Database and business logic](.cursor/rules/supabase.mdc) - Supabase limits, queries, and business context
- [Supabase derived types](.cursor/rules/supabase-derived-types.mdc) - `Pick<Tables<>>` for query projections; no hand-written Row duplicates
- [Vercel](.cursor/rules/vercel.mdc) - Deployment, Pro plan, cron routes, `CRON_SECRET`, env vars
