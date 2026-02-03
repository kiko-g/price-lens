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
- [Database and business logic](.cursor/rules/supabase.mdc) - Supabase and business logic rules. Essential for understanding limitations and the barebone layer of Price Lens.
