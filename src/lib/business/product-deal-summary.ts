import type { PricePoint, StoreProduct } from "@/types"

export type DealSummaryTier = "habitual" | "infrequent" | "middle" | "single" | "unknown"

export type ProductDealSummary = {
  summaryLine: string
  /** Short label for a badge; null when the summary alone is enough */
  tierLabel: string | null
  tier: DealSummaryTier
}

function matchesMostCommonBanner(sp: StoreProduct, mostCommon: PricePoint | null): boolean {
  return mostCommon != null && sp.price === mostCommon.price
}

export function getProductDealSummary(
  sp: StoreProduct,
  pricePoints: PricePoint[] | null,
  mostCommon: PricePoint | null,
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

  const currentPoint = pricePoints.find(
    (p) => p.price === sp.price && p.price_recommended === sp.price_recommended,
  )
  const freqPct =
    currentPoint != null ? Math.round((currentPoint.frequencyRatio ?? 0) * 100) : null

  if (freqPct == null) {
    return {
      summaryLine: "We couldn't match the current price to the aggregated history.",
      tierLabel: null,
      tier: "unknown",
    }
  }

  const isMostCommon = matchesMostCommonBanner(sp, mostCommon)

  let tier: DealSummaryTier
  let tierLabel: string | null
  if (isMostCommon || freqPct >= 50) {
    tier = "habitual"
    tierLabel = "Usually this price"
  } else if (freqPct < 15) {
    tier = "infrequent"
    tierLabel = "Uncommon right now"
  } else {
    tier = "middle"
    tierLabel = "Mixed frequency"
  }

  const priceLabel = sp.price != null ? `${sp.price.toFixed(2)}€` : "this price"

  if (isMostCommon) {
    return {
      summaryLine: `Current price (${priceLabel}) is the most common in our sample (~${freqPct}% of observations).`,
      tierLabel,
      tier,
    }
  }

  const modalLabel = mostCommon != null ? `${mostCommon.price.toFixed(2)}€` : "another level"
  return {
    summaryLine: `Current price shows up ~${freqPct}% of the time; the most common is ${modalLabel}.`,
    tierLabel,
    tier,
  }
}
