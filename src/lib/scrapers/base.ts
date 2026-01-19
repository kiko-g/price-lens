import type * as cheerio from "cheerio"
import type { StoreScraper, ScraperContext, RawProduct, ScrapeResult } from "./types"
import { StoreOrigin } from "./types"
import { fetchHtml, parseHtml, transformRawProduct, extractPriorityInfo, cleanUrl } from "./utils"

/**
 * Abstract base class for all store scrapers
 * Handles common logic: fetching, error handling, transformation
 * Subclasses only need to implement the extraction logic
 */
export abstract class BaseProductScraper implements StoreScraper {
  abstract readonly originId: StoreOrigin
  abstract readonly name: string

  /**
   * Main scrape method - orchestrates the full scraping flow
   * Returns a ScrapeResult with type indicating success, not_found (404), or error
   */
  async scrape(ctx: ScraperContext): Promise<ScrapeResult> {
    const cleanedUrl = cleanUrl(ctx.url)
    const priorityInfo = extractPriorityInfo(ctx.previousProduct)

    try {
      // Pass useAntiBlock to enable delays/rotating UA for bulk scraping
      const fetchResult = await fetchHtml(cleanedUrl, ctx.useAntiBlock)

      // Handle 404 - product definitively doesn't exist
      if (fetchResult.status === "not_found") {
        console.warn(`[${this.name}] Product not found (404): ${ctx.url}`)
        return { type: "not_found", product: null }
      }

      // Handle other fetch errors - don't change availability
      if (!fetchResult.html) {
        console.warn(`[${this.name}] Failed to fetch HTML from: ${ctx.url}`)
        return { type: "error", product: null }
      }

      const $ = parseHtml(fetchResult.html)

      // Check for soft 404 (page returns 200 but shows "not found" content)
      if (this.isSoftNotFound($)) {
        console.warn(`[${this.name}] Product not found (soft 404): ${ctx.url}`)
        return { type: "not_found", product: null }
      }

      const rawProduct = await this.extractRawProduct($, cleanedUrl)

      if (!rawProduct) {
        console.warn(`[${this.name}] Failed to extract product data from: ${ctx.url}`)
        return { type: "error", product: null }
      }

      return {
        type: "success",
        product: transformRawProduct(rawProduct, this.originId, priorityInfo),
      }
    } catch (error) {
      console.error(`[${this.name}] Unexpected error scraping ${ctx.url}:`, error)
      return { type: "error", product: null }
    }
  }

  /**
   * Store-specific extraction logic
   * Must be implemented by each store scraper
   */
  protected abstract extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null>

  /**
   * Detects "soft 404" pages - where HTTP status is 200 but content shows product not found
   * Override in store-specific scrapers to detect their error pages
   */
  protected isSoftNotFound($: cheerio.CheerioAPI): boolean {
    return false
  }

  /**
   * Helper to safely extract text from an element
   */
  protected getText($: cheerio.CheerioAPI, selector: string): string | null {
    const text = $(selector).first().text().trim()
    return text || null
  }

  /**
   * Helper to safely extract attribute from an element
   */
  protected getAttr($: cheerio.CheerioAPI, selector: string, attr: string): string | null {
    const value = $(selector).first().attr(attr)?.trim()
    return value || null
  }

  /**
   * Helper to safely parse JSON from an element attribute
   */
  protected parseJsonAttr<T>($: cheerio.CheerioAPI, selector: string, attr: string): T | null {
    const value = this.getAttr($, selector, attr)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
}
