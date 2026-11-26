import "server-only"

import { toHomepageDrop, type HomepageDrop, type HomepageDropRow } from "@/lib/business/homepage-drop"
import {
  DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS,
  PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE,
} from "@/lib/business/price-change"
import { withTimeout } from "@/lib/resilience"
import { createClient } from "@/lib/supabase/server"

const SUPABASE_QUERY_TIMEOUT_MS = parseInt(process.env.SUPABASE_QUERY_TIMEOUT_MS || "15000", 10)

export const HOMEPAGE_DROP_LIMIT = 8

/**
 * Eight recent price drops, ranked by the same history-weighted score as the
 * product listing. One small query — no count, no second page.
 */
export async function getHomepageDrops(): Promise<HomepageDrop[]> {
  try {
    const supabase = createClient()
    const cutoff = new Date(Date.now() - DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const query = supabase
      .from("store_products")
      .select("id, name, brand, image, origin_id, price, price_change_pct")
      .eq("available", true)
      .not("name", "is", null)
      .not("image", "is", null)
      .not("price", "is", null)
      .gt("price", 0)
      .not("last_price_change_at", "is", null)
      .gte("last_price_change_at", cutoff)
      .lt("price_change_pct", 0)
      .gte("price_change_pct", -PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE)
      .not("price_drop_smart_score", "is", null)
      .order("price_drop_smart_score", { ascending: false, nullsFirst: false })
      .limit(HOMEPAGE_DROP_LIMIT)

    const { data, error } = await withTimeout(
      Promise.resolve(query) as Promise<{ data: HomepageDropRow[] | null; error: { message: string } | null }>,
      SUPABASE_QUERY_TIMEOUT_MS,
    )

    if (error || !data) {
      console.error("[getHomepageDrops] query failed:", error)
      return []
    }

    return data.flatMap((row) => {
      const drop = toHomepageDrop(row)
      return drop ? [drop] : []
    })
  } catch (error) {
    console.error("[getHomepageDrops] failed:", error)
    return []
  }
}
