import "server-only"

import { toHomepageDrop, type HomepageDrop, type HomepageDropRow } from "@/lib/business/homepage-drop"
import { withTimeout } from "@/lib/resilience"
import { createClient } from "@/lib/supabase/server"

const SUPABASE_QUERY_TIMEOUT_MS = parseInt(process.env.SUPABASE_QUERY_TIMEOUT_MS || "15000", 10)

export const HOMEPAGE_DROP_LIMIT = 8

/**
 * Rows read past the indexed score before the in-memory filters
 * (image, price, plausible drop). Kept small so the homepage stays on
 * `idx_sp_price_drop_smart_score` and returns in one index scan.
 *
 * Do not add `last_price_change_at` or other predicates here. Combined with
 * this ORDER BY they timed out on production (statement timeout 57014) and
 * the section disappeared.
 */
const SCORE_CANDIDATES = 40

type ScoredRow = HomepageDropRow & { available: boolean | null }

/**
 * Up to eight history-weighted price drops. Same score as the product listing,
 * without that listing's recency filters — those cannot use the score index.
 */
export async function getHomepageDrops(): Promise<HomepageDrop[]> {
  try {
    const supabase = createClient()

    const query = supabase
      .from("store_products")
      .select("id, name, brand, image, origin_id, price, price_change_pct, available")
      .not("price_drop_smart_score", "is", null)
      .order("price_drop_smart_score", { ascending: false, nullsFirst: false })
      .limit(SCORE_CANDIDATES)

    const { data, error } = await withTimeout(
      Promise.resolve(query) as Promise<{ data: ScoredRow[] | null; error: { message: string } | null }>,
      SUPABASE_QUERY_TIMEOUT_MS,
    )

    if (error || !data) {
      console.error("[getHomepageDrops] query failed:", error)
      return []
    }

    const drops: HomepageDrop[] = []
    for (const row of data) {
      if (!row.available) continue
      const drop = toHomepageDrop(row)
      if (!drop) continue
      drops.push(drop)
      if (drops.length === HOMEPAGE_DROP_LIMIT) break
    }
    return drops
  } catch (error) {
    console.error("[getHomepageDrops] failed:", error)
    return []
  }
}
