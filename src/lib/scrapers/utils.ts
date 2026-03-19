import axios from "axios"
import * as cheerio from "cheerio"
import https from "https"
import { HttpsProxyAgent } from "https-proxy-agent"

import type { StoreOrigin, RawProduct, ScrapedProduct, PriorityInfo, FetchResult } from "@/lib/scrapers/types"
import { now } from "@/lib/utils"
import { formatProductName, packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/business/product"

/**
 * Connection pooling agent - reuses TCP connections to reduce handshake overhead.
 * When PROXY_URL is set, routes all requests through the proxy (e.g. residential proxy).
 */
const PROXY_URL = process.env.PROXY_URL

const httpsAgent = PROXY_URL
  ? new HttpsProxyAgent(PROXY_URL)
  : new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      timeout: 30000,
    })

if (PROXY_URL) {
  console.info(`[Scrapers] Using proxy: ${PROXY_URL.replace(/\/\/.*@/, "//***@")}`)
}

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Random delay to mimic human behavior (500ms - 2000ms)
export async function randomDelay(min = 500, max = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise((resolve) => setTimeout(resolve, delay))
}

const USER_AGENT = USER_AGENTS[0] // Default for non-scraping requests

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

/** Zero-width and other invisible chars that can cause 400 when unencoded (e.g. from decodeURIComponent). */
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\uFEFF]/g

/**
 * Fixes malformed percent-encoding and invisible chars that break requests.
 * - Lone % not followed by 2 hex digits -> %25 (e.g. "25%-gordura" -> "25%25-gordura")
 * - Zero-width space etc. -> percent-encoded (e.g. "nacional​/" -> "nacional%E2%80%8B/")
 */
function normalizeUrlEncoding(url: string): string {
  let s = url.replace(INVISIBLE_CHARS, (c) => encodeURIComponent(c))
  s = s.replace(/%(?![0-9A-Fa-f]{2})/g, "%25")
  return s
}

/**
 * Strips tracking/analytics parameters from URLs and normalizes malformed encoding.
 */
export function cleanUrl(url: string): string {
  try {
    const normalized = normalizeUrlEncoding(url)
    const urlObj = new URL(normalized)
    TRACKING_PARAMS.forEach((param) => urlObj.searchParams.delete(param))
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * Fetches HTML from a URL with error handling
 * Returns structured result with status to distinguish 404 from other errors
 * When useAntiBlock is true, adds random delay + rotating User-Agent (for bulk scraping)
 */
export async function fetchHtml(url: string, useAntiBlock = false): Promise<FetchResult> {
  if (!url) {
    console.warn("URL is required. Skipping product.")
    return { html: null, status: "error", httpStatus: null }
  }

  // Add random delay before request to avoid rate limiting (only for bulk scraping)
  if (useAntiBlock) {
    await randomDelay(300, 1500)
  }

  const cleanedUrl = cleanUrl(url)
  try {
    const headers: Record<string, string> = {}
    if (useAntiBlock) {
      headers["User-Agent"] = getRandomUserAgent()
    }
    try {
      headers["Referer"] = new URL(cleanedUrl).origin + "/"
    } catch {
      // malformed URL — skip Referer
    }
    const response = await httpClient.get(cleanedUrl, { headers })
    if (!response.data || typeof response.data !== "string") {
      console.warn("Empty or invalid response received. Skipping product.")
      return { html: null, status: "error", httpStatus: null }
    }
    return { html: response.data, status: "success", httpStatus: response.status }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Product definitively doesn't exist
      if (error.response?.status === 404) {
        console.warn(`[404] Product not found at URL: ${cleanedUrl}`)
        return { html: null, status: "not_found", httpStatus: 404 }
      }
      // Continente custom codes: product unlisted/hidden (not reachable); resurrection recheck will retry
      if (error.response?.status === 471 || error.response?.status === 474) {
        console.warn(`[${error.response.status}] Product not reachable at URL: ${cleanedUrl}`)
        return { html: null, status: "not_found", httpStatus: error.response.status }
      }
      // Transient / blocking responses — don't change availability
      // 429 = rate limited, 403 = blocked
      if (error.response?.status && [429, 403].includes(error.response.status)) {
        console.warn(`[${error.response.status}] Transient error at URL: ${cleanedUrl}`)
        return { html: null, status: "error", httpStatus: error.response.status }
      }
      if (error.code === "ECONNABORTED") {
        console.warn("Request timed out. Skipping product.")
        return { html: null, status: "error", httpStatus: null }
      }
    }
    console.warn(`Failed to fetch HTML for URL ${cleanedUrl}:`, error)
    return {
      html: null,
      status: "error",
      httpStatus: axios.isAxiosError(error) ? (error.response?.status ?? null) : null,
    }
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
