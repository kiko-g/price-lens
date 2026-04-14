import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS,
  PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE,
} from "@/lib/business/price-change"

export interface DealProduct {
  id: number
  origin_id: number
  url: string
  name: string
  brand: string | null
  pack: string | null
  price: number
  price_recommended: number | null
  discount: number | null
  image: string | null
  category: string | null
  available: boolean
  price_change_pct: number | null
  last_price_change_at: string | null
  updated_at: string
}

const DEAL_COLUMNS = [
  "id",
  "origin_id",
  "url",
  "name",
  "brand",
  "pack",
  "price",
  "price_recommended",
  "discount",
  "image",
  "category",
  "available",
  "price_change_pct",
  "last_price_change_at",
  "updated_at",
].join(", ")

export type DealsSection = "price-drops" | "discounts" | "best-value"

export interface DealsResult {
  priceDrops: DealProduct[]
  discounts: DealProduct[]
}

export async function getDeals(options?: { originId?: number; limit?: number }): Promise<DealsResult> {
  const supabase = createClient()
  const limit = options?.limit ?? 24

  const dropRecencyCutoff = new Date(
    Date.now() - DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  let priceDropsQuery = supabase
    .from("store_products")
    .select(DEAL_COLUMNS)
    .eq("available", true)
    .not("name", "is", null)
    .not("price", "is", null)
    .gt("price", 0)
    .not("last_price_change_at", "is", null)
    .gte("last_price_change_at", dropRecencyCutoff)
    .lt("price_change_pct", 0)
    .gte("price_change_pct", -PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE)
    .order("price_change_pct", { ascending: true })
    .limit(limit)

  let discountsQuery = supabase
    .from("store_products")
    .select(DEAL_COLUMNS)
    .eq("available", true)
    .not("name", "is", null)
    .not("price", "is", null)
    .gt("price", 0)
    .gt("discount", 0)
    .lte("discount", PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE)
    .order("discount", { ascending: false })
    .limit(limit)

  if (options?.originId) {
    priceDropsQuery = priceDropsQuery.eq("origin_id", options.originId)
    discountsQuery = discountsQuery.eq("origin_id", options.originId)
  }

  const [priceDropsResult, discountsResult] = await Promise.all([priceDropsQuery, discountsQuery])

  return {
    priceDrops: (priceDropsResult.data as unknown as DealProduct[]) || [],
    discounts: (discountsResult.data as unknown as DealProduct[]) || [],
  }
}
