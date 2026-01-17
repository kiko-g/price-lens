import type { StoreProduct, PrioritySource } from "@/types"

/**
 * Result of fetching HTML from a URL
 */
export type FetchStatus = "success" | "not_found" | "error"

export interface FetchResult {
  html: string | null
  status: FetchStatus
}

/**
 * Result of a scrape operation
 */
export type ScrapeResultType = "success" | "not_found" | "error"

export interface ScrapeResult {
  type: ScrapeResultType
  product: ScrapedProduct | null
}

/**
 * Raw product data extracted from HTML before normalization
 * All fields are optional since different stores may not provide all data
 */
export interface RawProduct {
  url: string
  name: string | null
  brand: string | null
  barcode: string | null
  pack: string | null
  price: string | number | null
  priceRecommended: string | number | null
  pricePerMajorUnit: string | number | null
  majorUnit: string | null
  image: string | null
  category: string | null
  category2: string | null
  category3: string | null
}

/**
 * Scraped product ready for database insertion
 * Excludes id, product_id, and updated_at which are managed separately:
 * - id and product_id are assigned by the database
 * - updated_at is only set by touchUpdatedAt() when a valid price is recorded
 */
export type ScrapedProduct = Omit<StoreProduct, "id" | "product_id" | "updated_at">

/**
 * Store origin identifiers
 */
export enum StoreOrigin {
  Continente = 1,
  Auchan = 2,
  PingoDoce = 3,
}

/**
 * Configuration passed to scrapers
 */
export interface ScraperContext {
  url: string
  previousProduct?: StoreProduct
}

/**
 * Interface that all store scrapers must implement
 */
export interface StoreScraper {
  readonly originId: StoreOrigin
  readonly name: string
  scrape(ctx: ScraperContext): Promise<ScrapeResult>
}

/**
 * Priority info preserved from previous product
 */
export interface PriorityInfo {
  priority: number | null
  prioritySource: PrioritySource | null
  priorityUpdatedAt: string | null
}
