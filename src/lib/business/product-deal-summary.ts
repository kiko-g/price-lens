import type { PricePoint, StoreProduct } from "@/types"

export type DealSummaryTier = "habitual" | "infrequent" | "nascent" | "middle" | "single" | "unknown"

export type ProductDealSummary = {
  summaryLine: string
  /** Short label for a badge; null when the summary alone is enough */
  tierLabel: string | null
  tier: DealSummaryTier
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
      summaryLine: "Only one price has been recorded in this window.",
      tierLabel: null,
      tier: "single",
    }
  }

  const currentPoint = pricePoints.find((p) => p.price === sp.price && p.price_recommended === sp.price_recommended)
  const freqPct = currentPoint != null ? Math.round((currentPoint.frequencyRatio ?? 0) * 100) : null

  if (freqPct == null) {
    return {
      summaryLine: "We couldn't match the current price to the aggregated history.",
      tierLabel: null,
      tier: "unknown",
    }
  }

  const isMostCommon = matchesMostCommonBanner(sp, mostCommon)
  const historyDays = Math.max(0, options?.historyDays ?? 0)

  const nascent = currentPoint != null && isNascentShortObservation(currentPoint, freqPct, isMostCommon, historyDays)

  let tier: DealSummaryTier
  let tierLabel: string | null
  if (isMostCommon || freqPct >= 50) {
    tier = "habitual"
    tierLabel = "Usually this price"
  } else if (nascent) {
    tier = "nascent"
    tierLabel = "Short time at this level"
  } else if (freqPct < 15) {
    tier = "infrequent"
    tierLabel = "Less common in our chart"
  } else {
    tier = "middle"
    tierLabel = "Mixed frequency"
  }

  const priceLabel = sp.price != null ? `${sp.price.toFixed(2)}€` : "this price"
  const ratio = currentPoint?.frequencyRatio
  const freqPhrase =
    freqPct === 0 && ratio != null && ratio > 0
      ? "less than 1% of tracked time"
      : freqPct === 0
        ? "0% of tracked time"
        : `about ${freqPct}% of tracked time`

  if (isMostCommon) {
    return {
      summaryLine: `Current price (${priceLabel}) is the most common in our sample (~${freqPct}% of observations).`,
      tierLabel,
      tier,
    }
  }

  const modalLabel = mostCommon != null ? `${mostCommon.price.toFixed(2)}€` : "another level"

  if (nascent && currentPoint != null) {
    const daysAtLevel = Math.max(1, Math.round(currentPoint.totalDuration / MS_PER_DAY))
    return {
      summaryLine: `This price has only been at this level for about ${daysAtLevel} day${
        daysAtLevel === 1 ? "" : "s"
      } in our ~${historyDays}-day sample (${freqPhrase}), so it looks uncommon—that often means a new or brief price, not only a special deal. The most common price is ${modalLabel}.`,
      tierLabel,
      tier,
    }
  }

  return {
    summaryLine: `Across our tracked history (time-weighted), this price appears ${freqPhrase}. The most common price is ${modalLabel}.`,
    tierLabel,
    tier,
  }
}
