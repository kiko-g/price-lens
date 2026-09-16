import { getRequestConfig } from "next-intl/server"

import { getBrand } from "@/lib/brand/server"
import { brandPlaceholders } from "@/lib/brand/brand"
import { applyBrandToMessages } from "@/lib/brand/messages"
import type { Messages } from "./types"
import { resolveLocale } from "./locale"

// Brand-resolved message trees are memoised per (locale, brand strings) so the substitution
// runs once per brand change instead of once per request.
const resolvedMessagesCache = new Map<string, Messages>()

async function loadMessages(locale: string): Promise<Messages> {
  const brand = await getBrand()
  const placeholders = brandPlaceholders(brand)
  const cacheKey = `${locale}|${Object.values(placeholders).join("|")}`

  const cached = resolvedMessagesCache.get(cacheKey)
  if (cached) return cached

  const raw = (await import(`../../messages/${locale}.json`)).default as Messages
  const resolved = applyBrandToMessages(raw, placeholders)
  resolvedMessagesCache.set(cacheKey, resolved)
  return resolved
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = await loadMessages(locale)

  return {
    locale,
    messages,
    timeZone: "Europe/Lisbon",
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: "2-digit", month: "2-digit", year: "numeric" },
        medium: { day: "2-digit", month: "short", year: "numeric" },
        long: { day: "2-digit", month: "long", year: "numeric" },
        dateTime: {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
      number: {
        currency: { style: "currency", currency: "EUR" },
        percent: { style: "percent", maximumFractionDigits: 1 },
      },
    },
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter((v) => v != null).join(".")
      console.warn(`[i18n] Missing translation for key "${path}" (locale: ${locale})`)
      return path
    },
  }
})
