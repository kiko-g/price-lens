import "server-only"

import { toHomepageDrop, type HomepageDrop, type HomepageDropRow } from "@/lib/business/homepage-drop"
import { withTimeout } from "@/lib/resilience"
import { createClient } from "@/lib/supabase/server"

const SUPABASE_QUERY_TIMEOUT_MS = parseInt(process.env.SUPABASE_QUERY_TIMEOUT_MS || "15000", 10)

export const HOMEPAGE_DROP_LIMIT = 8

/** Skip noise under 10% and the 65% ceiling, where the biggest rows cluster. */
const MIN_DROP_RATIO = 0.1
const MAX_DROP_RATIO = 0.4

/**
 * Food departments only. Home and beauty dominate the biggest percentage drops.
 * Names match `existingCategories` in `@/lib/business/data`. Commas omitted so
 * the PostgREST `in` list stays unambiguous.
 */
const GROCERY_CATEGORIES = [
  "Mercearia",
  "Frescos",
  "Congelados",
  "Laticínios e Ovos",
  "Bebidas e Garrafeira",
  "Alimentação",
  "Produtos Frescos",
  "Biológicos e Alternativas",
  "Alternativas Alimentares",
  "Bebidas",
  "Charcutaria",
  "Frigorifico",
  "Frutas E Vegetais",
  "Leite Natas E Ovos",
  "Padaria E Pastelaria",
  "Peixaria",
  "Talho",
] as const

/**
 * Extra rows so in-memory filters (image, plausible price) can still fill the grid.
 * The SQL itself must match `idx_sp_price_change_pct` (available, non-empty name,
 * order by price_change_pct). Ordering by price_drop_smart_score timed out on
 * production even as a bare index read (statement timeout 57014).
 */
const CANDIDATES = 24

/**
 * Up to eight grocery drops between 10% and 40% still on the shelf.
 * One indexed read — no count, no recency predicate, no score sort.
 */
export async function getHomepageDrops(): Promise<HomepageDrop[]> {
  try {
    const supabase = createClient()

    const query = supabase
      .from("store_products")
      .select("id, name, brand, image, origin_id, price, price_change_pct")
      .eq("available", true)
      .not("name", "is", null)
      .neq("name", "")
      .in("category", [...GROCERY_CATEGORIES])
      .gte("price_change_pct", -MAX_DROP_RATIO)
      .lt("price_change_pct", -MIN_DROP_RATIO)
      .order("price_change_pct", { ascending: true, nullsFirst: false })
      .limit(CANDIDATES)

    const { data, error } = await withTimeout(
      Promise.resolve(query) as Promise<{ data: HomepageDropRow[] | null; error: { message: string } | null }>,
      SUPABASE_QUERY_TIMEOUT_MS,
    )

    if (error || !data) {
      console.error("[getHomepageDrops] query failed:", error)
      return []
    }

    const drops: HomepageDrop[] = []
    for (const row of data) {
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
