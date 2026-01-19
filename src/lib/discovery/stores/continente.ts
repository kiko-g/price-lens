import { StoreOrigin } from "@/lib/scrapers/types"
import type { StoreDiscoveryConfig } from "../types"

/**
 * URL patterns for Continente product pages:
 * - https://www.continente.pt/produto/leite-meio-gordo-mimosa-1234567.html
 * - https://www.continente.pt/produto/...
 */
const PRODUCT_URL_PATTERN = /^https:\/\/www\.continente\.pt\/produto\/.+\.html$/

/**
 * Sitemap patterns that contain product URLs
 * From sitemap_index.xml:
 * - sitemap-custom_sitemap_1-product.xml
 * - sitemap-custom_sitemap_4-product.xml
 * - sitemap-custom_sitemap_8-product.xml
 * - sitemap-custom_sitemap_12-product.xml
 * - sitemap-custom_sitemap_16-product.xml
 */
const PRODUCT_SITEMAP_PATTERNS = [/-product\.xml$/i]

/**
 * Validates if a URL is a valid Continente product page
 */
function urlValidator(url: string): boolean {
  return PRODUCT_URL_PATTERN.test(url)
}

/**
 * Normalizes a Continente product URL for consistent storage
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
 * Extracts the SKU (product ID) from a Continente URL
 * URLs end with -{SKU}.html where SKU is a numeric ID
 * Example: .../produto/banana-continente-2597619.html -> "2597619"
 */
function skuExtractor(url: string): string | null {
  const match = url.match(/-(\d+)\.html$/)
  return match ? match[1] : null
}

export const continenteConfig: StoreDiscoveryConfig = {
  originId: StoreOrigin.Continente,
  name: "Continente",
  baseUrl: "https://www.continente.pt",
  sitemapIndexUrl: "https://www.continente.pt/sitemap_index.xml",
  productSitemapPatterns: PRODUCT_SITEMAP_PATTERNS,
  urlValidator,
  urlNormalizer,
  skuExtractor,
}
