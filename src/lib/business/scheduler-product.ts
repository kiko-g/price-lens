import type { ScrapeLane } from "@/lib/business/scrape-budget"
import type { Tables } from "@/types/supabase"

/** Columns fetched by scheduler lane queries — single source for `.select()` and types. */
export const SCHEDULER_COLUMN_KEYS = [
  "id",
  "url",
  "name",
  "origin_id",
  "priority",
  "priority_source",
  "barcode",
  "brand",
  "image",
  "pack",
  "category",
  "category_2",
  "category_3",
  "created_at",
  "updated_at",
  "scraped_at",
  "price_stats_cv_ln_90d",
] as const satisfies readonly (keyof Tables<"store_products">)[]

export const SCHEDULER_COLUMNS = SCHEDULER_COLUMN_KEYS.join(", ")

export type SchedulerProductRow = Pick<Tables<"store_products">, (typeof SCHEDULER_COLUMN_KEYS)[number]>

export type LaneProduct = SchedulerProductRow & { lane: ScrapeLane }

/** Row with the fields required to enqueue a scrape (filtered after `.select()`). */
export type ScrapeableSchedulerProduct = SchedulerProductRow & {
  url: string
  origin_id: number
}

export type ScrapeableLaneProduct = ScrapeableSchedulerProduct & { lane: ScrapeLane }

export function isScrapeableSchedulerProduct(row: SchedulerProductRow): row is ScrapeableSchedulerProduct {
  return row.url != null && row.origin_id != null
}

export function isScrapeableLaneProduct(row: LaneProduct): row is ScrapeableLaneProduct {
  return isScrapeableSchedulerProduct(row)
}

/**
 * QStash JSON contract between scheduler and batch-worker.
 * CamelCase wire shape; field types derived from `store_products` Row where possible.
 */
export type ScrapeBatchProductPayload = {
  id: SchedulerProductRow["id"]
  url: ScrapeableSchedulerProduct["url"]
  name: SchedulerProductRow["name"]
  originId: ScrapeableSchedulerProduct["origin_id"]
  priority: NonNullable<SchedulerProductRow["priority"]>
  prioritySource?: SchedulerProductRow["priority_source"]
  barcode?: SchedulerProductRow["barcode"]
  brand?: SchedulerProductRow["brand"]
  image?: SchedulerProductRow["image"]
  pack?: SchedulerProductRow["pack"]
  category?: SchedulerProductRow["category"]
  category2?: SchedulerProductRow["category_2"]
  category3?: SchedulerProductRow["category_3"]
  createdAt?: SchedulerProductRow["created_at"]
  updatedAt?: SchedulerProductRow["updated_at"]
}

export type ScrapeBatchRequest = {
  batchId: string
  lane?: ScrapeLane
  bulkJobId?: string
  products: ScrapeBatchProductPayload[]
}

export function toScrapeBatchProductPayload(product: ScrapeableSchedulerProduct): ScrapeBatchProductPayload {
  return {
    id: product.id,
    url: product.url,
    name: product.name,
    originId: product.origin_id,
    priority: product.priority ?? 0,
    prioritySource: product.priority_source,
    barcode: product.barcode,
    brand: product.brand,
    image: product.image,
    pack: product.pack,
    category: product.category,
    category2: product.category_2,
    category3: product.category_3,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

/**
 * Supabase `.select(string)` does not infer row shape — only the column const + Pick<> does.
 * Use after every `.select(SCHEDULER_COLUMNS)` call.
 */
export function parseSchedulerProductRows(data: unknown): SchedulerProductRow[] {
  if (!Array.isArray(data)) return []
  return data as SchedulerProductRow[]
}
