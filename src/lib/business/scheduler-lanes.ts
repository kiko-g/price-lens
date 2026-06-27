import type { SupabaseClient } from "@supabase/supabase-js"
import { ACTIVE_PRIORITIES, PRIORITY_REFRESH_HOURS } from "@/lib/business/priority"
import type { ScrapeLane } from "@/lib/business/scrape-budget"
import {
  isScrapeableLaneProduct,
  isScrapeableSchedulerProduct,
  parseSchedulerProductRows,
  SCHEDULER_COLUMNS,
  type LaneProduct,
  type ScrapeableLaneProduct,
  type SchedulerProductRow,
} from "@/lib/business/scheduler-product"
import type { Database } from "@/types/supabase"

export { SCHEDULER_COLUMNS, type LaneProduct, type SchedulerProductRow } from "@/lib/business/scheduler-product"

type LaneFetchResult = {
  products: LaneProduct[]
  backlogSize: number | null
}

const FAVORITES_PAGE_SIZE = 900
const RECHECK_CUTOFF_DAYS = 3

async function fetchAllFavoriteProductIds(supabase: SupabaseClient<Database>): Promise<number[]> {
  const ids: number[] = []
  let lastId = 0

  while (true) {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("id, store_product_id")
      .gt("id", lastId)
      .order("id")
      .limit(FAVORITES_PAGE_SIZE)

    if (error) {
      console.error("[Scheduler] Failed to paginate user_favorites:", error)
      break
    }
    if (!data?.length) break

    ids.push(...data.map((row) => row.store_product_id))
    lastId = data[data.length - 1]!.id
    if (data.length < FAVORITES_PAGE_SIZE) break
  }

  return [...new Set(ids)]
}

async function fetchViewedUnavailableIds(supabase: SupabaseClient<Database>, limit: number): Promise<number[]> {
  // product_views exists in production but is not yet in generated Database types
  const { data, error } = await (supabase as SupabaseClient)
    .from("product_views")
    .select("store_product_id")
    .order("view_date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[Scheduler] Failed to fetch product_views:", error)
    return []
  }

  return [...new Set((data ?? []).map((row: { store_product_id: number }) => row.store_product_id))]
}

function dedupeById(products: LaneProduct[]): LaneProduct[] {
  const seen = new Set<number>()
  const result: LaneProduct[] = []
  for (const product of products) {
    if (seen.has(product.id)) continue
    seen.add(product.id)
    result.push(product)
  }
  return result
}

/** Lane A — overdue P5..P2 available products, urgency-sorted by caller. */
export async function fetchSlaLaneProducts(
  supabase: SupabaseClient<Database>,
  now: Date,
  limit: number,
): Promise<LaneFetchResult> {
  const orConditions = ACTIVE_PRIORITIES.map((priority) => {
    const thresholdHours = PRIORITY_REFRESH_HOURS[priority]
    if (!thresholdHours) return null
    const cutoffTime = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString()
    return `and(priority.eq.${priority},or(updated_at.lt.${cutoffTime},updated_at.is.null))`
  }).filter(Boolean)

  if (orConditions.length === 0 || limit <= 0) {
    return { products: [], backlogSize: 0 }
  }

  const { data, count, error } = await supabase
    .from("store_products")
    .select(SCHEDULER_COLUMNS, { count: "exact" })
    .or(orConditions.join(","))
    .not("url", "is", null)
    .eq("available", true)
    .in("priority", [...ACTIVE_PRIORITIES])
    .limit(limit)

  if (error) {
    console.error("[Scheduler] SLA lane query error:", error)
    return { products: [], backlogSize: null }
  }

  return {
    products: parseSchedulerProductRows(data).filter(isScrapeableSchedulerProduct).map((row) => ({
      ...row,
      lane: "sla" as const,
    })),
    backlogSize: count,
  }
}

/**
 * Lane B — healing priority order (ROADMAP §4):
 * 1. Favorited/viewed unavailable
 * 2. Failed-last-scrape retries (available)
 * 3. Phantom products (scraped, no price)
 * 4. Graveyard sweep (oldest scraped_at, no barcode filter)
 */
export async function fetchHealingLaneProducts(
  supabase: SupabaseClient<Database>,
  now: Date,
  limit: number,
): Promise<LaneFetchResult> {
  if (limit <= 0) {
    return { products: [], backlogSize: 0 }
  }

  const recheckCutoff = new Date(now.getTime() - RECHECK_CUTOFF_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const collected: LaneProduct[] = []
  const excludeIds = () => collected.map((p) => p.id)
  let remaining = limit

  const pushRows = (rows: SchedulerProductRow[] | null) => {
    if (!rows?.length) return
    for (const row of rows) {
      if (!isScrapeableSchedulerProduct(row) || remaining <= 0) continue
      if (collected.some((p) => p.id === row.id)) continue
      collected.push({ ...row, lane: "healing" })
      remaining--
    }
  }

  // 1a. Favorited unavailable (paginated favorites — fixes 1000-row cap)
  const favoriteIds = await fetchAllFavoriteProductIds(supabase)
  if (favoriteIds.length > 0 && remaining > 0) {
    const { data } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS)
      .eq("available", false)
      .not("url", "is", null)
      .in("id", favoriteIds)
      .or(`updated_at.lt.${recheckCutoff},updated_at.is.null`)
      .limit(Math.min(remaining, 30))

    pushRows(parseSchedulerProductRows(data))
  }

  // 1b. Recently viewed unavailable
  if (remaining > 0) {
    const viewedIds = await fetchViewedUnavailableIds(supabase, 200)
    const unseenViewedIds = viewedIds.filter((id) => !excludeIds().includes(id))
    if (unseenViewedIds.length > 0) {
      const { data } = await supabase
        .from("store_products")
        .select(SCHEDULER_COLUMNS)
        .eq("available", false)
        .not("url", "is", null)
        .in("id", unseenViewedIds.slice(0, 100))
        .or(`updated_at.lt.${recheckCutoff},updated_at.is.null`)
        .limit(Math.min(remaining, 20))

      pushRows(parseSchedulerProductRows(data))
    }
  }

  // 2. Failed-last-scrape (available, scraped_at > updated_at)
  if (remaining > 0) {
    const { data: failedCandidates } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS)
      .eq("available", true)
      .not("scraped_at", "is", null)
      .not("updated_at", "is", null)
      .not("url", "is", null)
      .order("scraped_at", { ascending: true })
      .limit(Math.min(remaining * 3, 150))

    const failed = parseSchedulerProductRows(failedCandidates)
      .filter((p) => p.scraped_at && p.updated_at && new Date(p.scraped_at) > new Date(p.updated_at))
      .filter((p) => !excludeIds().includes(p.id))
      .slice(0, remaining)

    pushRows(failed)
  }

  // 3. Phantom products (RPC returns slim rows — re-fetch full columns)
  if (remaining > 0) {
    const { data: phantomRows, error: phantomError } = await supabase.rpc("get_phantom_scraped_products", {
      active_priorities: [...ACTIVE_PRIORITIES, 1],
      max_results: remaining,
    })

    if (phantomError) {
      console.error("[Scheduler] Phantom RPC error:", phantomError)
    } else if (phantomRows?.length) {
      const phantomIds = phantomRows.map((p) => p.id).filter((id) => !excludeIds().includes(id))
      if (phantomIds.length > 0) {
        const { data } = await supabase.from("store_products").select(SCHEDULER_COLUMNS).in("id", phantomIds)
        pushRows(parseSchedulerProductRows(data))
      }
    }
  }

  // 4. Graveyard sweep — oldest scraped_at, no barcode requirement
  if (remaining > 0) {
    const exclude = new Set(excludeIds())
    const { data } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS)
      .eq("available", false)
      .not("url", "is", null)
      .order("scraped_at", { ascending: true, nullsFirst: true })
      .limit(remaining + exclude.size)

    const graveyard = parseSchedulerProductRows(data)
      .filter((row) => !exclude.has(row.id))
      .slice(0, remaining)
    pushRows(graveyard)
  }

  return { products: collected, backlogSize: collected.length }
}

/**
 * Lane C — long tail: P1 round-robin (oldest scraped_at) then untriaged discovery skeletons.
 */
export async function fetchLongTailLaneProducts(
  supabase: SupabaseClient<Database>,
  limit: number,
): Promise<LaneFetchResult> {
  if (limit <= 0) {
    return { products: [], backlogSize: 0 }
  }

  const collected: LaneProduct[] = []
  let remaining = limit

  const { count: p1Backlog } = await supabase
    .from("store_products")
    .select("id", { count: "exact", head: true })
    .eq("priority", 1)
    .eq("available", true)
    .not("url", "is", null)

  const p1Limit = Math.min(remaining, Math.ceil(limit * 0.7))
  if (p1Limit > 0) {
    const { data: p1Products } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS)
      .eq("priority", 1)
      .eq("available", true)
      .not("url", "is", null)
      .order("scraped_at", { ascending: true, nullsFirst: true })
      .limit(p1Limit)

    for (const row of parseSchedulerProductRows(p1Products)) {
      if (!isScrapeableSchedulerProduct(row)) continue
      collected.push({ ...row, lane: "long_tail" })
      remaining--
    }
  }

  if (remaining > 0) {
    const { data: skeletons, count: skeletonBacklog } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS, { count: "exact" })
      .is("priority", null)
      .is("name", null)
      .not("url", "is", null)
      .not("origin_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(remaining)

    for (const row of parseSchedulerProductRows(skeletons)) {
      if (!isScrapeableSchedulerProduct(row)) continue
      collected.push({ ...row, lane: "long_tail" })
    }

    return {
      products: collected,
      backlogSize: (p1Backlog ?? 0) + (skeletonBacklog ?? 0),
    }
  }

  return { products: collected, backlogSize: p1Backlog }
}

export function mergeLaneProducts(
  sla: LaneProduct[],
  healing: LaneProduct[],
  longTail: LaneProduct[],
): LaneProduct[] {
  return dedupeById([...sla, ...healing, ...longTail])
}

/**
 * Build the queue actually sent to QStash — per-lane caps, SLA wins dedup.
 * Unlike mergeLaneProducts + slice(0, N), this guarantees healing/long_tail slots.
 */
export function buildScheduleQueue(
  sla: LaneProduct[],
  healing: LaneProduct[],
  longTail: LaneProduct[],
  quotas: { sla: number; healing: number; longTail: number },
): ScrapeableLaneProduct[] {
  const slaQueue = sla.filter(isScrapeableLaneProduct).slice(0, quotas.sla)
  const slaIds = new Set(slaQueue.map((p) => p.id))

  const healingQueue = healing
    .filter(isScrapeableLaneProduct)
    .filter((p) => !slaIds.has(p.id))
    .slice(0, quotas.healing)
  const healingIds = new Set(healingQueue.map((p) => p.id))

  const longTailQueue = longTail
    .filter(isScrapeableLaneProduct)
    .filter((p) => !slaIds.has(p.id) && !healingIds.has(p.id))
    .slice(0, quotas.longTail)

  return [...slaQueue, ...healingQueue, ...longTailQueue]
}

export type LaneFillStats = Record<ScrapeLane, { requested: number; filled: number; backlog: number | null }>

export function buildLaneFillStats(
  quotas: { sla: number; healing: number; longTail: number },
  sla: LaneFetchResult,
  healing: LaneFetchResult,
  longTail: LaneFetchResult,
): LaneFillStats {
  return {
    sla: { requested: quotas.sla, filled: sla.products.length, backlog: sla.backlogSize },
    healing: { requested: quotas.healing, filled: healing.products.length, backlog: healing.backlogSize },
    long_tail: {
      requested: quotas.longTail,
      filled: longTail.products.length,
      backlog: longTail.backlogSize,
    },
  }
}
