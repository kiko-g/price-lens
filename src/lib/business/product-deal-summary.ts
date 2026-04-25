import type { PricePoint, StoreProduct } from "@/types"

export type DealSummaryTier = "habitual" | "infrequent" | "nascent" | "middle" | "single" | "unknown"

export type DealSummaryTierLabelKey = "habitual" | "nascent" | "infrequent" | "middle"

/** Drives `freqPhrase.*` i18n under products.dealSummary */
export type FreqPhraseData = { kind: "lessThan1" } | { kind: "zero" } | { kind: "about"; pct: number }

/** Most common price display, or unknown when we cannot name a modal level */
export type DealModalLabel = { type: "price"; formatted: string } | { type: "unknown" }

export type DealSummaryBody =
  | { kind: "single" }
  | { kind: "unmatched" }
  | { kind: "mostCommon"; priceLabel: string | null; freqPct: number }
  | {
      kind: "nascent"
      daysAtLevel: number
      historyDays: number
      modal: DealModalLabel
      freq: FreqPhraseData
    }
  | { kind: "frequency"; modal: DealModalLabel; freq: FreqPhraseData }

export type ProductDealSummary = {
  tier: DealSummaryTier
  /** Maps to i18n `products.dealSummary.tierLabels.*`; null when the badge is omitted */
  tierLabelKey: DealSummaryTierLabelKey | null
  body: DealSummaryBody
}

export type ProductDealSummaryOptions = {
  /**
   * Length of the price history window (days). Used to avoid calling a price “rare” when
   * it only looks rare because the level is new or we have not observed it long yet.
   */
  historyDays?: number
}

/** Need enough history before “short stint” means something. */
const MIN_HISTORY_DAYS_FOR_NASCENT = 30
/** Current price level observed at most this many days → “nascent” if also low frequency. */
const MAX_STINT_DAYS_FOR_NASCENT = 21

const MS_PER_DAY = 1000 * 60 * 60 * 24

function matchesMostCommonBanner(sp: StoreProduct, mostCommon: PricePoint | null): boolean {
  return mostCommon != null && sp.price === mostCommon.price
}

function isNascentShortObservation(
  currentPoint: PricePoint,
  freqPct: number,
  isMostCommon: boolean,
  historyDays: number,
): boolean {
  if (isMostCommon || freqPct >= 15) return false
  if (historyDays < MIN_HISTORY_DAYS_FOR_NASCENT) return false
  if (currentPoint.occurrences !== 1) return false
  const daysAtLevel = currentPoint.totalDuration / MS_PER_DAY
  return daysAtLevel <= MAX_STINT_DAYS_FOR_NASCENT
}

function buildFreqPhraseData(freqPct: number, ratio: number | null | undefined): FreqPhraseData {
  if (freqPct === 0 && ratio != null && ratio > 0) {
    return { kind: "lessThan1" }
  }
  if (freqPct === 0) {
    return { kind: "zero" }
  }
  return { kind: "about", pct: freqPct }
}

export function getProductDealSummary(
  sp: StoreProduct,
  pricePoints: PricePoint[] | null,
  mostCommon: PricePoint | null,
  options?: ProductDealSummaryOptions,
): ProductDealSummary | null {
  if (!pricePoints?.length) return null

  const distinct = pricePoints.length
  if (distinct === 1) {
    return {
      body: { kind: "single" },
      tierLabelKey: null,
      tier: "single",
    }
  }

  const currentPoint = pricePoints.find((p) => p.price === sp.price && p.price_recommended === sp.price_recommended)
  const freqPct = currentPoint != null ? Math.round((currentPoint.frequencyRatio ?? 0) * 100) : null

  if (freqPct == null) {
    return {
      body: { kind: "unmatched" },
      tierLabelKey: null,
      tier: "unknown",
    }
  }

  const isMostCommon = matchesMostCommonBanner(sp, mostCommon)
  const historyDays = Math.max(0, options?.historyDays ?? 0)

  const nascent = currentPoint != null && isNascentShortObservation(currentPoint, freqPct, isMostCommon, historyDays)

  let tier: DealSummaryTier
  let tierLabelKey: DealSummaryTierLabelKey | null
  if (isMostCommon || freqPct >= 50) {
    tier = "habitual"
    tierLabelKey = "habitual"
  } else if (nascent) {
    tier = "nascent"
    tierLabelKey = "nascent"
  } else if (freqPct < 15) {
    tier = "infrequent"
    tierLabelKey = "infrequent"
  } else {
    tier = "middle"
    tierLabelKey = "middle"
  }

  const priceLabel: string | null = sp.price != null ? `${sp.price.toFixed(2)}€` : null
  const ratio = currentPoint?.frequencyRatio
  const freq = buildFreqPhraseData(freqPct, ratio)

  if (isMostCommon) {
    return {
      body: { kind: "mostCommon", priceLabel, freqPct },
      tierLabelKey,
      tier,
    }
  }

  const modal: DealModalLabel =
    mostCommon != null ? { type: "price", formatted: `${mostCommon.price.toFixed(2)}€` } : { type: "unknown" }

  if (nascent && currentPoint != null) {
    const daysAtLevel = Math.max(1, Math.round(currentPoint.totalDuration / MS_PER_DAY))
    return {
      body: {
        kind: "nascent",
        daysAtLevel,
        historyDays,
        modal,
        freq,
      },
      tierLabelKey,
      tier,
    }
  }

  return {
    body: { kind: "frequency", modal, freq },
    tierLabelKey,
    tier,
  }
}
