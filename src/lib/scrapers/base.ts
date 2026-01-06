import type * as cheerio from "cheerio"
import type { StoreScraper, ScraperContext, ScrapedProduct, RawProduct, PriorityInfo } from "./types"
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
   */
  async scrape(ctx: ScraperContext): Promise<ScrapedProduct | null> {
    const cleanedUrl = cleanUrl(ctx.url)
    const priorityInfo = extractPriorityInfo(ctx.previousProduct)

    try {
      const html = await fetchHtml(cleanedUrl)
      if (!html) {
        console.warn(`[${this.name}] Failed to fetch HTML from: ${ctx.url}`)
        return null
      }

      const $ = parseHtml(html)
      const rawProduct = await this.extractRawProduct($, cleanedUrl)

      if (!rawProduct) {
        console.warn(`[${this.name}] Failed to extract product data from: ${ctx.url}`)
        return null
      }

      return transformRawProduct(rawProduct, this.originId, priorityInfo)
    } catch (error) {
      console.error(`[${this.name}] Unexpected error scraping ${ctx.url}:`, error)
      return null
    }
  }

  /**
   * Store-specific extraction logic
   * Must be implemented by each store scraper
   */
  protected abstract extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null>

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

