/**
 * `store_products.price_change_pct` from `upsert_price_point` is a decimal ratio:
 * (new_price - old_price) / old_price, e.g. -0.25 means −25%.
 */

/** Cap for listing "price drop" / giant discount rows; relative change ratio (0.65 => 65%). */
export const PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE = 0.65

/** Default window for "recent" price moves on entry-point sorts (days). */
export const DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS = 14

/** Previous price before the last recorded change (undefined if ratio is invalid). */
export function priceBeforeFromChangeRatio(newPrice: number, changeRatio: number): number | undefined {
  if (newPrice <= 0 || changeRatio <= -1 || !Number.isFinite(changeRatio)) return undefined
  return newPrice / (1 + changeRatio)
}

/** Human-facing percent points (e.g. 25 for −25% when ratio is −0.25). */
export function priceChangeRatioToPercentPoints(changeRatio: number): number {
  return changeRatio * 100
}
