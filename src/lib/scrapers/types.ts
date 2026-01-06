import type { StoreProduct, PrioritySource } from "@/types"

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
 * Excludes id and product_id which are assigned by the database
 */
export type ScrapedProduct = Omit<StoreProduct, "id" | "product_id">

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
  scrape(ctx: ScraperContext): Promise<ScrapedProduct | null>
}

/**
 * Priority info preserved from previous product
 */
export interface PriorityInfo {
  priority: number | null
  prioritySource: PrioritySource | null
  priorityUpdatedAt: string | null
}

