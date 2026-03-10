import { StoreOrigin } from "@/lib/scrapers/types"
import type { CategoryCrawlConfig } from "@/lib/discovery/types"

/**
 * Pingo Doce product URLs follow:
 *   /home/produtos/{cat1}/{cat2}/{cat3?}/{slug}-{SKU}.html
 *   or /produtos/{cat1}/{cat2}/{cat3?}/{slug}-{SKU}.html (canonical variant)
 *
 * Both variants are valid; the scraper handles both.
 * The SFCC Search-UpdateGrid endpoint returns relative paths starting with /home/produtos/.
 */
const PRODUCT_URL_PATTERN = /^https:\/\/www\.pingodoce\.pt\/(home\/)?produtos\/.+\.html$/

function urlValidator(url: string): boolean {
  return PRODUCT_URL_PATTERN.test(url)
}

function urlNormalizer(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.search = ""
    parsed.hash = ""
    parsed.protocol = "https:"
    // Decode percent-encoded characters for consistent storage
    return decodeURIComponent(parsed.href)
  } catch {
    return url
  }
}

/**
 * Extracts SKU from trailing -{digits}.html pattern.
 * e.g. "leite-uht-meio-gordo-pingo-doce-48150.html" -> "48150"
 */
function skuExtractor(url: string): string | null {
  const match = url.match(/-(\d+)\.html$/)
  return match ? match[1] : null
}

export const pingoDoceConfig: CategoryCrawlConfig = {
  originId: StoreOrigin.PingoDoce,
  name: "Pingo Doce",
  baseUrl: "https://www.pingodoce.pt",
  categoryListUrl: "https://www.pingodoce.pt/home/produtos",
  searchEndpoint:
    "https://www.pingodoce.pt/on/demandware.store/Sites-pingo-doce-Site/default/Search-UpdateGrid",
  categoryIdPattern: /Search-Show\?cgid=(ec_[a-zA-Z0-9_]+)/g,
  productUrlPattern: /href="(\/home\/produtos\/[^"]*\.html)"/g,
  // L1 categories have 3 segments when split by "_": ec, name, number (e.g. "ec_mercearia_1300")
  l1SegmentCount: 3,
  pageSize: 200,
  delayMs: 300,
  urlValidator,
  urlNormalizer,
  skuExtractor,
}
