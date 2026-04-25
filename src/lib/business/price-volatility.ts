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

/** Keys under `products.priceStats.leads` (next-intl). */
export type VolatilityLeadKey = "collecting" | "steady" | "medium" | "jumpy" | "unclear"

export function getVolatilityLeadKey(band: VolatilityBand | null, sufficient: boolean): VolatilityLeadKey {
  if (!sufficient) return "collecting"
  if (band === "low") return "steady"
  if (band === "medium") return "medium"
  if (band === "high") return "jumpy"
  return "unclear"
}

/** User-facing band label (English); not used on consumer UI — prefer `getVolatilityLeadKey` + i18n. */
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

/** Keys under `products.priceStats.guidance.<id>.{compact,long}` (next-intl). */
export type PriceGuidanceScenario =
  | "fewPointsBigMove"
  | "hugeSwing"
  | "seeChart"
  | "dropWhenVolatile"
  | "calmNoRecentDrop"
  | "unusualDropWhenCalm"

export interface PriceGuidance {
  /** Message keys: `guidance.<scenario>.compact` and `guidance.<scenario>.long` */
  scenario: PriceGuidanceScenario
  tone: PriceGuidanceTone
}

type GuidanceInput = {
  priceChangePct: number | null | undefined
  lastPriceChangeAt: string | null | undefined
  obs90d: number | null | undefined
  band: VolatilityBand | null
}

/**
 * Heuristic copy (not predictive). Call only when `hasSufficientPriceStats` is true.
 * Resolve body via next-intl: `t(\`guidance.${scenario}.compact\`)` / `...long\``.
 */
export function getPriceMovementGuidance(input: GuidanceInput): PriceGuidance {
  const { priceChangePct, lastPriceChangeAt, obs90d, band } = input
  const obs = obs90d ?? 0
  const pct = priceChangePct ?? 0
  const absPct = Math.abs(pct)

  if (obs >= 2 && obs <= 5 && absPct >= 0.12) {
    return { tone: "warning", scenario: "fewPointsBigMove" }
  }

  if (absPct >= PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE * 0.85 && obs < 6) {
    return { tone: "info", scenario: "hugeSwing" }
  }

  if (band == null) {
    return { tone: "info", scenario: "seeChart" }
  }

  if (isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null) && band === "high") {
    return { tone: "warning", scenario: "dropWhenVolatile" }
  }

  if (band === "low" && !isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return { tone: "info", scenario: "calmNoRecentDrop" }
  }

  if (band === "low" && isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return { tone: "info", scenario: "unusualDropWhenCalm" }
  }

  return { tone: "info", scenario: "seeChart" }
}

export function hasSufficientPriceStats(
  updatedAt: string | null | undefined,
  obs90d: number | null | undefined,
): boolean {
  if (updatedAt == null) return false
  const obs = obs90d ?? 0
  return obs >= 2
}

/** Distinct price-level count from `/api/prices?analytics` (store product page only). */
export type PriceHistoryHint = {
  loading: boolean
  /** From analytics `pricePoints.length`; `null` when product is not tracked / fetch not used. */
  levels: number | null
}

/**
 * Single-level history: the chart, frequency table, and "most common price" row already say it all.
 * Omit the desktop "How stable is this price?" card to avoid stacking redundant boxes.
 */
export function shouldHideDesktopPriceStabilityCallout(priceHistoryHint?: PriceHistoryHint): boolean {
  if (priceHistoryHint == null) return false
  if (priceHistoryHint.loading) return false
  return priceHistoryHint.levels === 1
}

/** After this many days since listing/tracking anchor, do not imply denormalized stats are "still syncing". */
export const PRICE_STATS_UI_SYNC_GRACE_DAYS = 28

function ageInDaysSince(iso: string | null | undefined): number | null {
  if (iso == null || iso === "") return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return (Date.now() - t) / 86_400_000
}

/** Keys under `products.priceStats.insufficient` (next-intl). */
export type InsufficientPriceStatsKind =
  | "sameLevel"
  | "stillSyncing"
  | "noSummaryYet"
  | "noHistory"
  | "oneCheck"
  | "noChecks90d"
  | "needMoreData"
  | "fallback"

export type InsufficientPriceStatsResult = { kind: InsufficientPriceStatsKind }

/** When consumer UI has no blurb, resolve copy via `t("insufficient." + result.kind)` */
export function getInsufficientPriceStatsResult(
  updatedAt: string | null | undefined,
  obs90d: number | null | undefined,
  priceHistoryHint?: PriceHistoryHint | null,
  statsSyncGraceAnchorAt?: string | null,
): InsufficientPriceStatsResult | null {
  if (priceHistoryHint?.loading) {
    return null
  }

  if (priceHistoryHint != null && priceHistoryHint.levels === 1) {
    return { kind: "sameLevel" }
  }

  if (priceHistoryHint != null && priceHistoryHint.levels != null && priceHistoryHint.levels >= 2) {
    const age = ageInDaysSince(statsSyncGraceAnchorAt)
    const withinSyncGrace = age != null && age <= PRICE_STATS_UI_SYNC_GRACE_DAYS
    if (withinSyncGrace) {
      return { kind: "stillSyncing" }
    }
    return { kind: "noSummaryYet" }
  }

  if (priceHistoryHint != null && priceHistoryHint.levels === 0) {
    return { kind: "noHistory" }
  }

  if (updatedAt != null) {
    const obs = obs90d ?? 0
    if (obs === 1) {
      return { kind: "oneCheck" }
    }
    if (obs === 0) {
      return { kind: "noChecks90d" }
    }
    return { kind: "needMoreData" }
  }

  return { kind: "fallback" }
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
