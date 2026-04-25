import { createClient } from "@/lib/supabase/server"
import type { StoreProductWithMeta, SupabaseClient } from "@/lib/queries/store-products/types"
import {
  DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS,
  PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE,
} from "@/lib/business/price-change"
import { withTimeout } from "@/lib/resilience"
import { DEFAULT_DEALS_PAGE_LIMIT, MAX_DEALS_PAGE_LIMIT } from "@/lib/queries/deals-constants"
import type { DealsFeedPagination, DealsFeedResult, QueryDealsFeedParams } from "@/lib/queries/deals-feed.types"

const SUPABASE_QUERY_TIMEOUT_MS = parseInt(process.env.SUPABASE_QUERY_TIMEOUT_MS || "15000", 10)

/** Same column projection as store product listings so cards and favorites augmentation stay compatible */
const DEAL_FEED_COLUMNS = [
  "id",
  "origin_id",
  "url",
  "name",
  "brand",
  "barcode",
  "pack",
  "price",
  "price_recommended",
  "price_per_major_unit",
  "major_unit",
  "discount",
  "image",
  "category",
  "category_2",
  "category_3",
  "priority",
  "priority_source",
  "priority_updated_at",
  "available",
  "updated_at",
  "price_change_pct",
  "last_price_change_at",
  "price_stats_obs_90d",
  "price_stats_cv_ln_90d",
  "price_drop_smart_score",
  "price_stats_updated_at",
].join(", ")

function emptyPagination(page: number, limit: number): DealsFeedPagination {
  return {
    page,
    limit,
    totalCount: null,
    totalPages: null,
    hasNextPage: false,
    hasPreviousPage: page > 1,
  }
}

function buildDealsOrFilter(dropRecencyCutoff: string): string {
  const mag = PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE
  const cutoffQuoted = `"${dropRecencyCutoff.replace(/"/g, '\\"')}"`
  return [
    "and(",
    "last_price_change_at.not.is.null,",
    `last_price_change_at.gte.${cutoffQuoted},`,
    "price_change_pct.lt.0,",
    `price_change_pct.gte.-${mag}`,
    "),",
    "and(",
    `discount.gt.0,discount.lte.${mag}`,
    ")",
  ].join("")
}

/**
 * Unified deals feed: rows that are either a recent plausible price drop or an on-shelf discount
 * (same rules as the former split queries), ordered for browsing, paginated with limit+1 (no COUNT).
 */
export async function queryDealsFeed(
  params: QueryDealsFeedParams = {},
  client?: SupabaseClient,
): Promise<DealsFeedResult> {
  const supabase = client ?? createClient()

  const page = Math.max(1, params.page ?? 1)
  const rawLimit = params.limit ?? DEFAULT_DEALS_PAGE_LIMIT
  const limit = Math.min(MAX_DEALS_PAGE_LIMIT, Math.max(1, rawLimit))
  const offset = (page - 1) * limit

  const dropRecencyCutoff = new Date(
    Date.now() - DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  let query = supabase
    .from("store_products")
    .select(DEAL_FEED_COLUMNS)
    .eq("available", true)
    .not("name", "is", null)
    .not("price", "is", null)
    .gt("price", 0)
    .or(buildDealsOrFilter(dropRecencyCutoff))

  if (params.originId != null) {
    query = query.eq("origin_id", params.originId)
  }

  query = query
    .order("price_drop_smart_score", { ascending: false, nullsFirst: false })
    .order("discount", { ascending: false, nullsFirst: false })
    .order("price_change_pct", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit)

  const { data, error } = await withTimeout(
    Promise.resolve(query) as Promise<{
      data: StoreProductWithMeta[] | null
      error: { message: string; code?: string } | null
    }>,
    SUPABASE_QUERY_TIMEOUT_MS,
  )

  if (error) {
    return {
      data: [],
      pagination: emptyPagination(page, limit),
      error: { message: error.message, code: error.code },
    }
  }

  const rows = (data ?? []) as StoreProductWithMeta[]
  const hasNextPage = rows.length > limit
  const pageData = hasNextPage ? rows.slice(0, limit) : rows

  return {
    data: pageData,
    pagination: {
      page,
      limit,
      totalCount: null,
      totalPages: null,
      hasNextPage,
      hasPreviousPage: page > 1,
    },
    error: null,
  }
}
