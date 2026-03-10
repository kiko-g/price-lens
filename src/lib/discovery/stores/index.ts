import { StoreOrigin } from "@/lib/scrapers/types"
import { auchanConfig } from "@/lib/discovery/stores/auchan"
import { continenteConfig } from "@/lib/discovery/stores/continente"
import { pingoDoceConfig } from "@/lib/discovery/stores/pingo-doce"
import type { StoreDiscoveryConfig, CategoryCrawlConfig } from "@/lib/discovery/types"

/**
 * Sitemap-based discovery configs (Continente, Auchan)
 */
export const sitemapConfigs: Record<number, StoreDiscoveryConfig> = {
  [StoreOrigin.Continente]: continenteConfig,
  [StoreOrigin.Auchan]: auchanConfig,
}

/**
 * Category crawl discovery configs (Pingo Doce)
 */
export const categoryCrawlConfigs: Record<number, CategoryCrawlConfig> = {
  [StoreOrigin.PingoDoce]: pingoDoceConfig,
}

export function getStoreConfig(originId: number): StoreDiscoveryConfig | null {
  return sitemapConfigs[originId] || null
}

export function getCategoryCrawlConfig(originId: number): CategoryCrawlConfig | null {
  return categoryCrawlConfigs[originId] || null
}

/**
 * Returns all store configs (both sitemap and category crawl) for status display.
 * Each entry has the common fields needed by the status endpoint.
 */
export function getAllStoreConfigs(): { originId: number; name: string; sitemapIndexUrl: string }[] {
  const sitemap = Object.values(sitemapConfigs).map((c) => ({
    originId: c.originId,
    name: c.name,
    sitemapIndexUrl: c.sitemapIndexUrl,
  }))
  const crawl = Object.values(categoryCrawlConfigs).map((c) => ({
    originId: c.originId,
    name: c.name,
    sitemapIndexUrl: c.categoryListUrl,
  }))
  return [...sitemap, ...crawl]
}

export { continenteConfig, auchanConfig, pingoDoceConfig }
