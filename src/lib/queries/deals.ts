import { createClient } from "@/lib/supabase/server"

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

  let priceDropsQuery = supabase
    .from("store_products")
    .select(DEAL_COLUMNS)
    .eq("available", true)
    .not("name", "is", null)
    .lt("price_change_pct", 0)
    .order("price_change_pct", { ascending: true })
    .limit(limit)

  let discountsQuery = supabase
    .from("store_products")
    .select(DEAL_COLUMNS)
    .eq("available", true)
    .not("name", "is", null)
    .gt("discount", 0)
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
