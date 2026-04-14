import { DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS, PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE } from "./price-change"

/** CV of log prices (90d); heuristic bands (tune against production distributions). */
const CV_LOW_MAX = 0.04
const CV_MEDIUM_MAX = 0.12

export type VolatilityBand = "low" | "medium" | "high"

export function volatilityBandFromCv(cv: number | null | undefined): VolatilityBand | null {
  if (cv == null || !Number.isFinite(cv) || cv < 0) return null
  if (cv <= CV_LOW_MAX) return "low"
  if (cv <= CV_MEDIUM_MAX) return "medium"
  return "high"
}

/** Short plain-English lead for shoppers (not “volatility” jargon). */
export function volatilityCasualLead(band: VolatilityBand | null, sufficient: boolean): string {
  if (!sufficient) return "We're still collecting prices here"
  if (band === "low") return "Mostly steady lately"
  if (band === "medium") return "Moves up and down a bit"
  if (band === "high") return "Often jumps between levels"
  return "Pattern still unclear"
}

/** User-facing band label (English); prefer `volatilityCasualLead` on consumer UI. */
export function volatilityBandLabel(band: VolatilityBand): string {
  switch (band) {
    case "low":
      return "Low volatility"
    case "medium":
      return "Moderate volatility"
    case "high":
      return "High volatility"
  }
}

function isRecentPriceDrop(lastChangeAt: string | null | undefined, changeRatio: number | null | undefined): boolean {
  if (lastChangeAt == null || changeRatio == null || changeRatio >= 0) return false
  const t = new Date(lastChangeAt).getTime()
  if (!Number.isFinite(t)) return false
  const cutoff = Date.now() - DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS * 24 * 60 * 60 * 1000
  return t >= cutoff
}

export type PriceGuidanceTone = "info" | "warning"

export interface PriceGuidance {
  body: string
  tone: PriceGuidanceTone
}

type GuidanceOpts = { compact?: boolean }

/**
 * Heuristic copy (not predictive). Call only when `hasSufficientPriceStats` is true.
 * Use `compact` on small screens: one short sentence, casual tone.
 */
export function getPriceMovementGuidance(
  input: {
    priceChangePct: number | null | undefined
    lastPriceChangeAt: string | null | undefined
    obs90d: number | null | undefined
    band: VolatilityBand | null
  },
  opts?: GuidanceOpts,
): PriceGuidance {
  const compact = opts?.compact ?? false
  const { priceChangePct, lastPriceChangeAt, obs90d, band } = input
  const obs = obs90d ?? 0
  const pct = priceChangePct ?? 0
  const absPct = Math.abs(pct)

  if (obs >= 2 && obs <= 5 && absPct >= 0.12) {
    return {
      tone: "warning",
      body: compact
        ? "Big move, few price points. Compare shops."
        : "Recent change is large and we still have few price points in this window. Check the chart and other stores before you decide.",
    }
  }

  if (absPct >= PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE * 0.85 && obs < 6) {
    return {
      tone: "info",
      body: compact
        ? "Huge swing. Verify on the chart."
        : "This change looks big compared to what we've seen. Treat it as rough and confirm on the chart.",
    }
  }

  if (band == null) {
    return {
      tone: "info",
      body: compact
        ? "Typical price? See the chart."
        : "Use the chart to see if today's price is normal for this product.",
    }
  }

  if (isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null) && band === "high") {
    return {
      tone: "warning",
      body: compact
        ? "Bumpy history. Chart shows if it's a deal."
        : "This price often moves. A drop can still be a deal. Glance at the chart before you buy.",
    }
  }

  if (band === "low" && !isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return {
      tone: "info",
      body: compact
        ? "Fairly calm. No rush from this alone."
        : "Recently this price has been fairly calm. No need to rush based on this hint alone.",
    }
  }

  if (band === "low" && isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return {
      tone: "info",
      body: compact
        ? "Unusual drop for a steady price. Peek at the chart."
        : "A drop like this is less common when the price is usually steady. Worth comparing the chart and other stores.",
    }
  }

  return {
    tone: "info",
    body: compact
      ? "Typical price? See the chart."
      : "Use the chart to see if today's price is normal for this product.",
  }
}

export function hasSufficientPriceStats(
  updatedAt: string | null | undefined,
  obs90d: number | null | undefined,
): boolean {
  if (updatedAt == null) return false
  const obs = obs90d ?? 0
  return obs >= 2
}

/** Show volatility callout on product page mobile only at or above this (reduces noise when history is thin). */
export const MOBILE_PRICE_STATS_MIN_OBSERVATIONS = 8

export function shouldShowMobilePriceStatsCallout(
  updatedAt: string | null | undefined,
  obs90d: number | null | undefined,
): boolean {
  if (!hasSufficientPriceStats(updatedAt, obs90d)) return false
  const obs = obs90d ?? 0
  return obs >= MOBILE_PRICE_STATS_MIN_OBSERVATIONS
}
