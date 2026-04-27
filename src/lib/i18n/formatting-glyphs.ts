/** Glyphs and percent helpers for JSX: prefer `{X}` / `{fn()}` over raw JSX text (FormatJS no-literal-string-in-jsx). */

import { EM_DASH } from "@/lib/i18n/punctuation"

export { EM_DASH }

export const UNICODE_MINUS = "\u2212"
export const PLUS_SIGN = "+"
export const BULLET = "\u2022"
export const MIDDLE_DOT = "\u00B7"
export const MULTIPLY_SIGN = "\u00D7"
export const EUR_SUFFIX = "\u20AC"
export const PRICE_PLACEHOLDER = `--.--${EUR_SUFFIX}`
export const PRICE_MISSING_SHORT = `--${EUR_SUFFIX}`

/** Black right-pointing small triangle (e.g. current row marker in tables). */
export const CURRENT_ROW_MARKER = "\u25B8"

export function formatEuroCompact(amount: number, decimals = 2): string {
  return `${amount.toFixed(decimals)}${EUR_SUFFIX}`
}

export function formatEuroLeading(amount: number, decimals = 2): string {
  return `${EUR_SUFFIX}${amount.toFixed(decimals)}`
}

export function formatEuroPerMajorUnit(amount: number, majorUnit: string, decimals = 2): string {
  const unit = majorUnit.startsWith("/") ? majorUnit.slice(1) : majorUnit
  return `${amount.toFixed(decimals)}${EUR_SUFFIX}/${unit}`
}

export function formatPercentFixed(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatPercentSigned(value: number, decimals = 1): string {
  const sign = value >= 0 ? PLUS_SIGN : ""
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatPercentRange(min: number, max: number, decimals = 1): string {
  return `${min.toFixed(decimals)}% to ${max.toFixed(decimals)}%`
}
