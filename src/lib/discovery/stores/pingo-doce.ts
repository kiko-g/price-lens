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
    return parsed.href
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

function normalizeCategory(raw: string | null): string | null {
  if (!raw) return null
  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Extracts store categories from Pingo Doce URL path:
 *   /home/produtos/{cat1}/{cat2}/{cat3?}/{slug}-{SKU}.html
 */
function categoryExtractor(url: string): {
  category: string | null
  category2: string | null
  category3: string | null
} {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const produtosIdx = pathParts.findIndex((p) => p === "produtos")

    if (produtosIdx === -1) {
      return { category: null, category2: null, category3: null }
    }

    const categoryRaw = pathParts[produtosIdx + 1] ?? null
    const category2Raw = pathParts[produtosIdx + 2] ?? null
    // cat3 exists only when there are 4+ segments after "produtos" (cat1/cat2/cat3/slug.html)
    const category3Raw = pathParts[produtosIdx + 4] ? pathParts[produtosIdx + 3] : null

    return {
      category: normalizeCategory(categoryRaw),
      category2: normalizeCategory(category2Raw),
      category3: normalizeCategory(category3Raw),
    }
  } catch {
    return { category: null, category2: null, category3: null }
  }
}

export const pingoDoceConfig: CategoryCrawlConfig = {
  originId: StoreOrigin.PingoDoce,
  name: "Pingo Doce",
  baseUrl: "https://www.pingodoce.pt",
  categoryListUrl: "https://www.pingodoce.pt/home/produtos",
  searchEndpoint: "https://www.pingodoce.pt/on/demandware.store/Sites-pingo-doce-Site/default/Search-UpdateGrid",
  categoryIdPattern: /Search-Show\?cgid=(ec_[a-zA-Z0-9_]+)/g,
  productUrlPattern: /href="(\/home\/produtos\/[^"]*\.html)"/g,
  l1SegmentCount: 3,
  pageSize: 200,
  delayMs: 300,
  urlValidator,
  urlNormalizer,
  skuExtractor,
  categoryExtractor,
}
