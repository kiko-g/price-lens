import { NextResponse } from "next/server"
import type { StoreProduct } from "@/types"
import { storeProductQueries } from "@/lib/db/queries/products"

import { StoreOrigin, type StoreScraper, type ScrapedProduct } from "./types"
import { fetchHtml } from "./utils"

import { auchanScraper } from "./origins/auchan"
import { continenteScraper } from "./origins/continente"
import { pingoDoceScraper } from "./origins/pingo-doce"

// Re-export types
export type { StoreScraper, ScrapedProduct, ScraperContext, RawProduct, PriorityInfo } from "./types"
export { StoreOrigin } from "./types"

// Re-export utilities that external code might need
export { cleanUrl, fetchHtml } from "./utils"

/**
 * Map of origin IDs to scraper instances
 */
const scraperMap: Record<number, StoreScraper> = {
  [StoreOrigin.Continente]: continenteScraper,
  [StoreOrigin.Auchan]: auchanScraper,
  [StoreOrigin.PingoDoce]: pingoDoceScraper,
}

/**
 * Get the appropriate scraper for a given origin ID
 */
export function getScraper(originId: number): StoreScraper {
  const scraper = scraperMap[originId]
  if (!scraper) {
    throw new Error(`Unknown origin id: ${originId}`)
  }
  return scraper
}

/**
 * Legacy compatibility: Scrapers object with productPage methods
 */
export const Scrapers = {
  continente: {
    productPage: async (url: string, prevSp?: StoreProduct) =>
      continenteScraper.scrape({ url, previousProduct: prevSp }) as Promise<ScrapedProduct | Record<string, never>>,
  },
  auchan: {
    productPage: async (url: string, prevSp?: StoreProduct) =>
      auchanScraper.scrape({ url, previousProduct: prevSp }) as Promise<ScrapedProduct | Record<string, never>>,
  },
  pingoDoce: {
    productPage: async (url: string, prevSp?: StoreProduct) =>
      pingoDoceScraper.scrape({ url, previousProduct: prevSp }) as Promise<ScrapedProduct | Record<string, never>>,
  },
}

/**
 * Validates if an object is a valid scraped product
 */
export function isValidProduct(product: unknown): product is ScrapedProduct {
  return (
    typeof product === "object" &&
    product !== null &&
    "url" in product &&
    typeof (product as Record<string, unknown>).url === "string"
  )
}

/**
 * Scrapes a product URL and upserts it to the database
 */
export async function scrapeAndReplaceProduct(url: string | null, origin: number | null, prevSp?: StoreProduct) {
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  if (!origin) {
    return NextResponse.json({ error: "Origin ID is required" }, { status: 400 })
  }

  const scraper = getScraper(origin)
  const product = await scraper.scrape({ url, previousProduct: prevSp })

  if (!product) {
    await storeProductQueries.upsertBlank({ url })
    return NextResponse.json({ error: "StoreProduct scraping failed", url }, { status: 404 })
  }

  if (!isValidProduct(product)) {
    return NextResponse.json({ error: "Invalid product data", url }, { status: 422 })
  }

  // Cast to StoreProduct - id and product_id are assigned by the database on insert
  const { data, error } = await storeProductQueries.createOrUpdateProduct(
    product as unknown as import("@/types").StoreProduct,
  )

  if (error) {
    return NextResponse.json({ data, error: "StoreProduct upsert failed", details: error, product }, { status: 500 })
  }

  return NextResponse.json({ data: product, message: "StoreProduct upserted" })
}

// ============================================================================
// Category Crawling (Continente-specific, kept for backwards compatibility)
// ============================================================================

import { categories } from "@/lib/mock/continente"
import * as cheerio from "cheerio"

export async function continenteCategoryPageScraper(url: string): Promise<string[]> {
  const links: string[] = []

  const getPaginatedUrl = (url: string, start: number): string => {
    if (url.includes("?start=")) return url.replace(/(\?start=)\d+/, `$1${start}`)
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}start=${start}`
  }

  const grabLinksInPage = ($: cheerio.CheerioAPI): string[] => {
    const pageLinks: string[] = []
    $(".product-tile").each((_, element) => {
      const firstLink = $(element).find("a[href]").first()
      if (firstLink.length) {
        const href = firstLink.attr("href")
        if (href) pageLinks.push(href)
      }
    })
    return pageLinks
  }

  let start = 0
  let hasMorePages = true

  while (hasMorePages) {
    const paginatedUrl = getPaginatedUrl(url, start)
    console.log(`Fetching: ${paginatedUrl}`)

    const html = await fetchHtml(paginatedUrl)
    if (!html) {
      hasMorePages = false
      continue
    }

    const $ = cheerio.load(html)
    const newLinks = grabLinksInPage($)

    if (newLinks.length > 0) {
      links.push(...newLinks)
      start += newLinks.length
    } else {
      hasMorePages = false
    }
  }

  return links
}

export async function crawlContinenteCategoryPages() {
  for (const category of Object.values(categories)) {
    console.info("Crawling", category.url)
    const start = performance.now()
    const links = await continenteCategoryPageScraper(category.url)
    console.info("Finished scraping", category.name, links.length)

    for (const link of links) {
      await storeProductQueries.upsertBlank({ url: link })
    }

    console.log("Finished storing", category.name, links.length, performance.now() - start)
  }
}

// ============================================================================
// Batch Processing Utilities
// ============================================================================

export function batchUrls(urls: string[], batchSize: number): string[][] {
  const batches: string[][] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize))
  }
  return batches
}

export async function processBatch(urls: string[]): Promise<(ScrapedProduct | { url: string; error: unknown })[]> {
  const products = await Promise.all(
    urls.map((url) => continenteScraper.scrape({ url }).then((p) => p || { url, error: "Failed to scrape" })),
  )
  return products
}
