export const locales = ["en", "pt"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "pt"

export const LOCALE_COOKIE = "NEXT_LOCALE"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  pt: "pt-PT",
}

const LOCALE_OG: Record<Locale, string> = {
  en: "en_US",
  pt: "pt_PT",
}

export function toLocaleTag(locale: Locale): string {
  return LOCALE_TAG[locale]
}

export function toOpenGraphLocale(locale: Locale): string {
  return LOCALE_OG[locale]
}

export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const parts = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .filter(Boolean)

  for (const tag of parts) {
    if (tag.startsWith("pt")) return "pt"
    if (tag.startsWith("en")) return "en"
  }
  return null
}
