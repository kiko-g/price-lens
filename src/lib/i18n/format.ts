import { enUS, pt as ptLocale } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"

import { isLocale, toLocaleTag, type Locale } from "@/i18n/config"

/**
 * Client- and server-safe formatting helpers that accept an explicit
 * locale. Prefer these over bare `toLocaleString` calls so we have
 * one place to change formatting behaviour.
 *
 * Currency is always EUR (Portugal-only product), only the numeric
 * and date formatting varies between locales.
 */

function resolveTag(input: Locale | string | undefined): string {
  if (input && isLocale(input)) return toLocaleTag(input)
  return typeof input === "string" && input.length > 0 ? input : toLocaleTag("pt")
}

export function formatPrice(price: number, locale?: Locale | string): string {
  return new Intl.NumberFormat(resolveTag(locale), {
    style: "currency",
    currency: "EUR",
  }).format(price)
}

export function formatNumber(value: number, locale?: Locale | string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(resolveTag(locale), options).format(value)
}

export function formatDate(
  date: Date | string | number,
  locale?: Locale | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return d.toLocaleDateString(resolveTag(locale), options)
}

export function formatDateTime(
  date: Date | string | number,
  locale?: Locale | string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return d.toLocaleString(resolveTag(locale), options)
}

export function getDateFnsLocale(locale: Locale | string | undefined): DateFnsLocale {
  return locale && isLocale(locale) && locale === "pt" ? ptLocale : locale === "pt" ? ptLocale : enUS
}
