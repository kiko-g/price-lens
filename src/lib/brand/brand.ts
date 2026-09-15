import { z } from "zod"

import type { Locale } from "@/i18n/config"

/**
 * Brand Control Center — single source of truth for every user-visible brand string.
 *
 * Rules:
 * - Components, metadata, manifest, emails and OG images read from `BrandSettings`, never from literals.
 * - Runtime values come from the `app_settings` table (key `brand`) and fall back to `BRAND_DEFAULTS`.
 * - Messages in `messages/*.json` reference the brand through `{brand}`, `{brandShort}` and
 *   `{brandLegal}` placeholders, resolved once per request in `src/i18n/request.ts`.
 *
 * Brand system language (not the app title): Verb "Pulse" · Perk "Awareness" · Payoff "Reveal".
 */

export const BRAND_SETTINGS_KEY = "brand"
export const BRAND_CACHE_TAG = "brand-settings"

/** Static hunter mark for <img>, OG, email and PWA. The live SVG is `LinceMark`. */
export const BRAND_MARK_SRC = "/lince-mark.svg"

const brandText = z.string().trim().min(1).max(80)
const longText = z.string().trim().min(1).max(400)

// `satisfies` guarantees every locale in `locales` has an entry; adding a locale fails typecheck here.
const localizedTextSchema = z.object({ pt: longText, en: longText }) satisfies z.ZodType<Record<Locale, string>>

export const brandSettingsSchema = z.object({
  displayName: brandText,
  shortName: z.string().trim().min(1).max(12),
  legalName: brandText,
  /** Small-caps line under the wordmark (system language, e.g. "Pulso dos preços"). */
  eyebrow: localizedTextSchema,
  tagline: localizedTextSchema,
  metaDescription: localizedTextSchema,
})

// Stored rows may predate a field or a locale; nested partials keep them loadable.
const storedBrandSettingsSchema = brandSettingsSchema.partial().extend({
  eyebrow: localizedTextSchema.partial().optional(),
  tagline: localizedTextSchema.partial().optional(),
  metaDescription: localizedTextSchema.partial().optional(),
})

export type LocalizedText = Record<Locale, string>
export type BrandSettings = z.infer<typeof brandSettingsSchema>
export type BrandSettingsInput = z.input<typeof brandSettingsSchema>

export const BRAND_DEFAULTS: BrandSettings = {
  displayName: "Lince",
  shortName: "Lince",
  legalName: "Lince",
  eyebrow: {
    pt: "Pulso dos preços",
    en: "Price pulse",
  },
  tagline: {
    pt: "O pulso dos preços dos supermercados em Portugal.",
    en: "The pulse of supermarket prices in Portugal.",
  },
  metaDescription: {
    pt: "Monitorização diária de preços dos supermercados portugueses (Continente, Auchan e Pingo Doce). Vê o que muda, compra no momento certo e revela quanto poupas.",
    en: "Daily price monitoring for Portuguese supermarkets (Continente, Auchan and Pingo Doce). See what changes, buy at the right time and reveal how much you save.",
  },
}

/**
 * Merges a partial/unknown stored value over the defaults, dropping anything invalid.
 * Never throws: a corrupt row must not take the site down.
 */
export function mergeBrandSettings(stored: unknown): BrandSettings {
  if (!stored || typeof stored !== "object") return BRAND_DEFAULTS

  const parsed = storedBrandSettingsSchema.safeParse(stored)
  if (!parsed.success) {
    console.warn("[brand] stored settings failed validation, using defaults:", parsed.error.issues)
    return BRAND_DEFAULTS
  }

  const partial = parsed.data
  return {
    displayName: partial.displayName ?? BRAND_DEFAULTS.displayName,
    shortName: partial.shortName ?? BRAND_DEFAULTS.shortName,
    legalName: partial.legalName ?? BRAND_DEFAULTS.legalName,
    eyebrow: { ...BRAND_DEFAULTS.eyebrow, ...partial.eyebrow },
    tagline: { ...BRAND_DEFAULTS.tagline, ...partial.tagline },
    metaDescription: { ...BRAND_DEFAULTS.metaDescription, ...partial.metaDescription },
  }
}

export function getBrandText(text: LocalizedText, locale: string): string {
  return text[locale as Locale] ?? text.pt
}

/** Flat placeholder map used for message substitution and admin previews. */
export function brandPlaceholders(brand: BrandSettings): Record<string, string> {
  return {
    brand: brand.displayName,
    brandShort: brand.shortName,
    brandLegal: brand.legalName,
  }
}
