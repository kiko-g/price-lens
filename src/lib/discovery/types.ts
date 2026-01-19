import { StoreOrigin } from "@/lib/scrapers/types"

/**
 * Configuration for a store's sitemap discovery
 */
export interface StoreDiscoveryConfig {
  originId: StoreOrigin
  name: string
  baseUrl: string
  sitemapIndexUrl: string
  productSitemapPatterns: RegExp[]
  urlValidator: (url: string) => boolean
  urlNormalizer: (url: string) => string
  /**
   * Extracts a unique product identifier (SKU) from a URL.
   * Used for deduplication since the same product can have different URL slugs.
   * Returns null if SKU cannot be extracted.
   */
  skuExtractor: (url: string) => string | null
}

/**
 * A single URL entry from a sitemap
 */
export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

/**
 * Result of parsing a sitemap
 */
export interface SitemapParseResult {
  urls: SitemapUrl[]
  errors: string[]
}

/**
 * Result of fetching a sitemap index
 */
export interface SitemapIndexResult {
  sitemaps: {
    loc: string
    lastmod?: string
  }[]
  errors: string[]
}

/**
 * Discovery source types
 */
export type DiscoverySource = "sitemap" | "category_crawl" | "search" | "manual" | "barcode_crossref"

/**
 * Status of a discovery run
 */
export type DiscoveryRunStatus = "running" | "completed" | "failed" | "cancelled"

/**
 * Record of a discovery run for metrics
 */
export interface DiscoveryRun {
  id?: number
  origin_id: number
  discovery_source: DiscoverySource
  status: DiscoveryRunStatus
  started_at: string
  completed_at?: string | null
  urls_found: number
  urls_new: number
  urls_existing: number
  urls_invalid: number
  errors: string[]
  metadata?: Record<string, unknown>
}

/**
 * Result of a discovery operation
 */
export interface DiscoveryResult {
  originId: number
  originName: string
  source: DiscoverySource
  urlsFound: number
  urlsNew: number
  urlsExisting: number
  urlsInvalid: number
  errors: string[]
  durationMs: number
  sampleNewUrls: string[]
}

/**
 * Options for running discovery
 */
export interface DiscoveryOptions {
  dryRun?: boolean
  maxUrls?: number
  verbose?: boolean
}
