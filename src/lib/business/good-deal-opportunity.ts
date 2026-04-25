import type { PricePoint, StoreProduct } from "@/types"
import { getProductDealSummary } from "@/lib/business/product-deal-summary"

/** Aligned with deal listings / preview samples — strong but not only top decile. */
const SMART_SCORE_SHOW_THRESHOLD = 0.12
/** Discount is stored as 0–1 (e.g. 0.32 = 32%). */
const DISCOUNT_STRONG = 0.2
const DISCOUNT_WITH_HABITUAL_TIER = 0.1

export type GoodDealAnalytics = {
  pricePoints: PricePoint[] | null
  mostCommon: PricePoint | null
  historyDays: number
}

/**
 * Whether to show the “good opportunity” (🔥) badge — conservative so it does not
 * contradict “uncommon price” copy unless the model score is strong.
 */
export function shouldShowGoodDealOpportunity(sp: StoreProduct, analytics: GoodDealAnalytics | null): boolean {
  if (sp.available === false) return false
  if (sp.price == null || sp.price <= 0) return false

  const smart = sp.price_drop_smart_score
  if (smart != null && smart >= SMART_SCORE_SHOW_THRESHOLD) {
    return true
  }

  if (sp.discount != null && sp.discount >= DISCOUNT_STRONG) {
    return true
  }

  if (analytics?.pricePoints?.length) {
    const deal = getProductDealSummary(sp, analytics.pricePoints, analytics.mostCommon, {
      historyDays: analytics.historyDays,
    })
    if (deal?.tier === "habitual" && sp.discount != null && sp.discount >= DISCOUNT_WITH_HABITUAL_TIER) {
      return true
    }
  }

  return false
}
