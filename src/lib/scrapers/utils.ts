import axios from "axios"
import * as cheerio from "cheerio"
import https from "https"
import { formatProductName, now, packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"
import type { RawProduct, ScrapedProduct, PriorityInfo, FetchResult } from "./types"
import { StoreOrigin } from "./types"

/**
 * Connection pooling agent - reuses TCP connections to reduce handshake overhead
 */
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000,
})

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const TRACKING_PARAMS = [
  "_gl",
  "_ga",
  "_gid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
]

/**
 * Pre-configured axios instance with optimized settings
 */
export const httpClient = axios.create({
  httpsAgent,
  timeout: 8000,
  headers: {
    "User-Agent": USER_AGENT,
    "Accept-Encoding": "gzip, deflate, br",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  },
  decompress: true,
})

/**
 * Strips tracking/analytics parameters from URLs
 */
export function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    TRACKING_PARAMS.forEach((param) => urlObj.searchParams.delete(param))
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * Fetches HTML from a URL with error handling
 * Returns structured result with status to distinguish 404 from other errors
 */
export async function fetchHtml(url: string): Promise<FetchResult> {
  if (!url) {
    console.warn("URL is required. Skipping product.")
    return { html: null, status: "error" }
  }

  const cleanedUrl = cleanUrl(url)
  try {
    const response = await httpClient.get(cleanedUrl)
    if (!response.data || typeof response.data !== "string") {
      console.warn("Empty or invalid response received. Skipping product.")
      return { html: null, status: "error" }
    }
    return { html: response.data, status: "success" }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Check for 404 specifically - product doesn't exist
      if (error.response?.status === 404) {
        console.warn(`[404] Product not found at URL: ${cleanedUrl}`)
        return { html: null, status: "not_found" }
      }
      if (error.code === "ECONNABORTED") {
        console.warn("Request timed out. Skipping product.")
      }
    }
    console.warn(`Failed to fetch HTML for URL ${cleanedUrl}:`, error)
    return { html: null, status: "error" }
  }
}

/**
 * Loads HTML into cheerio for parsing
 */
export function parseHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html)
}

/**
 * Extracts JSON-LD structured data from HTML
 */
export function extractJsonLd($: cheerio.CheerioAPI): Record<string, unknown> | null {
  try {
    const jsonLdScript = $('script[type="application/ld+json"]').first().text().trim()
    if (!jsonLdScript) return null

    const parsed = JSON.parse(jsonLdScript)
    if (Array.isArray(parsed)) {
      return parsed.find((item) => item["@type"] === "Product") || null
    }
    return parsed["@type"] === "Product" ? parsed : null
  } catch {
    return null
  }
}

/**
 * Validates if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Transforms raw extracted data into a normalized ScrapedProduct
 */
export function transformRawProduct(
  raw: RawProduct,
  originId: StoreOrigin,
  priorityInfo: PriorityInfo,
): ScrapedProduct {
  const price = raw.price ? priceToNumber(String(raw.price)) : null
  const priceRecommended = raw.priceRecommended ? priceToNumber(String(raw.priceRecommended)) : price
  const pricePerMajorUnit = raw.pricePerMajorUnit ? priceToNumber(String(raw.pricePerMajorUnit)) : null
  const discount = priceRecommended && priceRecommended > 0 ? Math.max(0, 1 - (price ?? 0) / priceRecommended) : 0

  return {
    url: raw.url,
    name: raw.name || "Unknown Product",
    brand: raw.brand,
    barcode: raw.barcode,
    pack: raw.pack ? packageToUnit(raw.pack) : null,
    price: price || 0,
    price_recommended: priceRecommended,
    price_per_major_unit: pricePerMajorUnit,
    major_unit: raw.majorUnit,
    discount,
    image: raw.image ? resizeImgSrc(raw.image, 500, 500) : null,
    category: raw.category,
    category_2: raw.category2,
    category_3: raw.category3,
    origin_id: originId,
    priority: priorityInfo.priority,
    priority_source: priorityInfo.prioritySource,
    priority_updated_at: priorityInfo.priorityUpdatedAt || now(),
    available: raw.available ?? true, // Default to true unless explicitly set to false
    created_at: "",
    // NOTE: updated_at is intentionally NOT set here - it should only be set
    // when a valid price point is recorded in updatePricePoint()
  }
}

/**
 * Extracts priority info from a previous product (for updates)
 */
export function extractPriorityInfo(prevProduct?: {
  priority?: number | null
  priority_source?: string | null
}): PriorityInfo {
  return {
    priority: prevProduct?.priority ?? null,
    prioritySource: (prevProduct?.priority_source as PriorityInfo["prioritySource"]) ?? "ai",
    priorityUpdatedAt: now(),
  }
}

// Re-export utility functions that scrapers might need
export { formatProductName, priceToNumber, resizeImgSrc, packageToUnit }
