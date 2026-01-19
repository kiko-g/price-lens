import { StoreOrigin } from "@/lib/scrapers/types"
import type { StoreDiscoveryConfig } from "../types"

/**
 * URL patterns for Auchan product pages:
 * - https://www.auchan.pt/pt/alimentacao/lacticinios-e-ovos/leite/leite-meio-gordo/leite-meia-gordo-auchan-1-l/123456.html
 * - https://www.auchan.pt/pt/.../.../.../.../PRODUCT_ID.html
 */
const PRODUCT_URL_PATTERN = /^https:\/\/www\.auchan\.pt\/pt\/.+\/\d+\.html$/

/**
 * Sitemap patterns that contain product URLs
 * From sitemap_index.xml:
 * - sitemap_0-product.xml
 * - sitemap_1-product.xml
 */
const PRODUCT_SITEMAP_PATTERNS = [/-product\.xml$/i]

/**
 * Validates if a URL is a valid Auchan product page
 */
function urlValidator(url: string): boolean {
  return PRODUCT_URL_PATTERN.test(url)
}

/**
 * Normalizes an Auchan product URL for consistent storage
 * - Removes query parameters
 * - Removes trailing slashes
 * - Ensures https
 */
function urlNormalizer(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove query params and hash
    parsed.search = ""
    parsed.hash = ""
    // Ensure https
    parsed.protocol = "https:"
    // Return cleaned URL
    return parsed.href
  } catch {
    return url
  }
}

/**
 * Extracts the SKU (product ID) from an Auchan URL
 * URLs end with /{SKU}.html where SKU is a numeric ID
 * Example: .../leite-meio-gordo/123456.html -> "123456"
 */
function skuExtractor(url: string): string | null {
  const match = url.match(/\/(\d+)\.html$/)
  return match ? match[1] : null
}

export const auchanConfig: StoreDiscoveryConfig = {
  originId: StoreOrigin.Auchan,
  name: "Auchan",
  baseUrl: "https://www.auchan.pt",
  sitemapIndexUrl: "https://www.auchan.pt/sitemap_index.xml",
  productSitemapPatterns: PRODUCT_SITEMAP_PATTERNS,
  urlValidator,
  urlNormalizer,
  skuExtractor,
}
