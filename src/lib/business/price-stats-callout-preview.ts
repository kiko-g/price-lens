import type { StoreProduct } from "@/types"

const STATS_NOW = new Date().toISOString()
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
const TWENTY_DAYS_AGO = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()

/** Minimal valid row for rendering `ProductPriceStatsCallout` in admin previews. */
export function previewBaseStoreProduct(): StoreProduct {
  return {
    id: 999001,
    origin_id: 1,
    url: "https://example.com/admin-preview",
    name: "Preview — energy drink4-pack",
    brand: "Preview Brand",
    barcode: null,
    pack: "4 × 50 cl",
    price: 5.56,
    price_recommended: 6.96,
    price_per_major_unit: 2.78,
    major_unit: "/lt",
    discount: 0.201,
    image: null,
    category: "Drinks",
    category_2: "Soft drinks",
    category_3: "Energy",
    priority: 2,
    priority_updated_at: STATS_NOW,
    priority_source: "ai",
    available: true,
    created_at: STATS_NOW,
    updated_at: STATS_NOW,
  }
}

export type PriceStatsCalloutPreviewScenario = {
  id: string
  title: string
  description: string
  patch: Partial<StoreProduct>
}

/**
 * Emulated states for the price-stats callout (admin UI review). Patches merge over `previewBaseStoreProduct()`.
 */
export const PRICE_STATS_CALLOUT_PREVIEW_SCENARIOS: PriceStatsCalloutPreviewScenario[] = [
  {
    id: "insufficient-no-updated-at",
    title: "Insufficient data (no stats refresh yet)",
    description: "`price_stats_updated_at` is null — common before the stats worker has run.",
    patch: {
      price_stats_updated_at: null,
      price_stats_obs_90d: null,
      price_stats_cv_ln_90d: null,
      price_drop_smart_score: null,
      price_change_pct: -0.15,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "insufficient-thin-obs",
    title: "Insufficient data (few observations)",
    description: "Stats timestamp set but fewer than 2 observations in the 90d window.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 1,
      price_stats_cv_ln_90d: 0,
      price_drop_smart_score: null,
      price_change_pct: -0.05,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "low-vol-stable",
    title: "Low volatility, no recent drop",
    description: "Stable price; last move outside the 14-day “recent” window.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 28,
      price_stats_cv_ln_90d: 0.03,
      price_drop_smart_score: 0.08,
      price_change_pct: -0.03,
      last_price_change_at: TWENTY_DAYS_AGO,
    },
  },
  {
    id: "low-vol-recent-drop",
    title: "Low volatility + recent drop",
    description: "Usually stable; drop in the last ~14 days.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 30,
      price_stats_cv_ln_90d: 0.035,
      price_drop_smart_score: 0.22,
      price_change_pct: -0.12,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "high-vol-recent-drop",
    title: "High volatility + recent drop",
    description: "Noisy price; recent decrease — promo-style hint.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 18,
      price_stats_cv_ln_90d: 0.14,
      price_drop_smart_score: 0.35,
      price_change_pct: -0.18,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "medium-vol-generic",
    title: "Moderate volatility (generic hint)",
    description: "Falls through to the default chart reminder.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 22,
      price_stats_cv_ln_90d: 0.08,
      price_drop_smart_score: 0.15,
      price_change_pct: 0.02,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "thin-history-large-move",
    title: "Thin history + large move",
    description: "2–5 observations and ≥12% move — cautious copy.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 4,
      price_stats_cv_ln_90d: 0.06,
      price_drop_smart_score: 0.2,
      price_change_pct: -0.14,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "near-cap-magnitude",
    title: "Large magnitude vs history (few observations)",
    description: "Triggers plausibility / limited-history messaging.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 5,
      price_stats_cv_ln_90d: 0.05,
      price_drop_smart_score: 0.25,
      price_change_pct: -0.58,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
  {
    id: "no-cv-band",
    title: "Sufficient obs but no CV band",
    description: "CV null or invalid — band label shows fallback; guidance uses generic line.",
    patch: {
      price_stats_updated_at: STATS_NOW,
      price_stats_obs_90d: 12,
      price_stats_cv_ln_90d: null,
      price_drop_smart_score: 0.1,
      price_change_pct: -0.04,
      last_price_change_at: TWO_DAYS_AGO,
    },
  },
]
