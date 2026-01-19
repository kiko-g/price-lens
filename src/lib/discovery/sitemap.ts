import * as cheerio from "cheerio"
import type { SitemapUrl, SitemapParseResult, SitemapIndexResult } from "./types"

const USER_AGENT = "PriceLens-Discovery/1.0 (+https://pricelens.pt)"
const FETCH_TIMEOUT = 30000

/**
 * Fetches XML content from a URL
 */
async function fetchXml(url: string): Promise<{ xml: string | null; error: string | null }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/xml, text/xml, */*",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { xml: null, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const xml = await response.text()
    return { xml, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error"
    return { xml: null, error: message }
  }
}

/**
 * Parses a sitemap index XML and extracts child sitemap URLs
 */
export async function parseSitemapIndex(url: string): Promise<SitemapIndexResult> {
  const { xml, error } = await fetchXml(url)

  if (error || !xml) {
    return { sitemaps: [], errors: [error || "Empty response"] }
  }

  try {
    const $ = cheerio.load(xml, { xmlMode: true })
    const sitemaps: SitemapIndexResult["sitemaps"] = []
    const errors: string[] = []

    $("sitemap").each((_, elem) => {
      const loc = $(elem).find("loc").text().trim()
      const lastmod = $(elem).find("lastmod").text().trim() || undefined

      if (loc) {
        sitemaps.push({ loc, lastmod })
      } else {
        errors.push("Sitemap entry missing <loc>")
      }
    })

    return { sitemaps, errors }
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : "XML parse error"
    return { sitemaps: [], errors: [message] }
  }
}

/**
 * Parses a sitemap XML and extracts URLs
 */
export async function parseSitemap(url: string): Promise<SitemapParseResult> {
  const { xml, error } = await fetchXml(url)

  if (error || !xml) {
    return { urls: [], errors: [error || "Empty response"] }
  }

  try {
    const $ = cheerio.load(xml, { xmlMode: true })
    const urls: SitemapUrl[] = []
    const errors: string[] = []

    $("url").each((_, elem) => {
      const loc = $(elem).find("loc").text().trim()
      const lastmod = $(elem).find("lastmod").text().trim() || undefined
      const changefreq = $(elem).find("changefreq").text().trim() || undefined
      const priority = $(elem).find("priority").text().trim() || undefined

      if (loc) {
        urls.push({ loc, lastmod, changefreq, priority })
      } else {
        errors.push("URL entry missing <loc>")
      }
    })

    return { urls, errors }
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : "XML parse error"
    return { urls: [], errors: [message] }
  }
}

/**
 * Fetches and parses all product URLs from a store's sitemaps
 */
export async function fetchProductUrlsFromSitemaps(
  sitemapIndexUrl: string,
  productSitemapPatterns: RegExp[],
  options: { verbose?: boolean } = {},
): Promise<{ urls: SitemapUrl[]; errors: string[]; sitemapsFetched: number }> {
  const allUrls: SitemapUrl[] = []
  const allErrors: string[] = []
  let sitemapsFetched = 0

  if (options.verbose) {
    console.log(`[Discovery] Fetching sitemap index: ${sitemapIndexUrl}`)
  }

  const indexResult = await parseSitemapIndex(sitemapIndexUrl)

  if (indexResult.errors.length > 0) {
    allErrors.push(...indexResult.errors.map((e) => `Index: ${e}`))
  }

  // Filter to only product sitemaps
  const productSitemaps = indexResult.sitemaps.filter((sitemap) =>
    productSitemapPatterns.some((pattern) => pattern.test(sitemap.loc)),
  )

  if (options.verbose) {
    console.log(`[Discovery] Found ${productSitemaps.length} product sitemaps out of ${indexResult.sitemaps.length}`)
  }

  // Fetch each product sitemap
  for (const sitemap of productSitemaps) {
    if (options.verbose) {
      console.log(`[Discovery] Fetching: ${sitemap.loc}`)
    }

    const result = await parseSitemap(sitemap.loc)
    sitemapsFetched++

    if (result.errors.length > 0) {
      allErrors.push(...result.errors.map((e) => `${sitemap.loc}: ${e}`))
    }

    allUrls.push(...result.urls)

    if (options.verbose) {
      console.log(`[Discovery]   → ${result.urls.length} URLs`)
    }
  }

  return { urls: allUrls, errors: allErrors, sitemapsFetched }
}
