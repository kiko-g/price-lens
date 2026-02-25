import type * as cheerio from "cheerio"
import { BaseProductScraper } from "@/lib/scrapers/base"
import { StoreOrigin, type RawProduct } from "@/lib/scrapers/types"
import { priceToNumber } from "@/lib/scrapers/utils"

interface EciDataLayerProduct {
  id: string
  brand: string
  category: string[]
  name: string
  price: { final: string; original?: string }
  status: string
  quantity: string
  currency: string
}

interface EciDataLayerContent {
  product: EciDataLayerProduct
}

const UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(cl|ml|l|lt|kg|g|gr|un|unid)\b/i

/**
 * Scraper for El Corte Inglés supermarket (origin_id: 4)
 * Site: elcorteingles.pt/supermercado/
 */
export class ElCorteInglesScraper extends BaseProductScraper {
  readonly originId = StoreOrigin.ElCorteIngles
  readonly name = "ElCorteIngles"

  protected isSoftNotFound($: cheerio.CheerioAPI): boolean {
    const hasProductPrices = $(".prices.pdp-prices").length > 0
    if (!hasProductPrices) return true

    const dataLayer = this.extractDataLayer($)
    return !dataLayer?.product
  }

  protected async extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null> {
    const dataLayer = this.extractDataLayer($)
    const product = dataLayer?.product
    if (!product) return null

    const pumText = this.getText($, ".prices-price._pum")
    const { pricePerUnit, majorUnit } = this.parsePricePerUnit(pumText)

    return {
      url,
      name: product.name || null,
      brand: product.brand || null,
      barcode: this.extractBarcode($),
      pack: this.extractPack(product),
      price: product.price?.final || null,
      priceRecommended: product.price?.original || null,
      pricePerMajorUnit: pricePerUnit,
      majorUnit,
      image: this.getAttr($, 'meta[property="og:image"]', "content"),
      category: product.category?.[0] || null,
      category2: product.category?.[1] || null,
      category3: product.category?.[2] || null,
      available: product.status === "AVAILABLE",
    }
  }

  /**
   * Parses the `dataLayerContent` JS object from an inline <script> tag.
   * The assignment looks like: `dataLayerContent = { ... };`
   */
  private extractDataLayer($: cheerio.CheerioAPI): EciDataLayerContent | null {
    let result: EciDataLayerContent | null = null

    $("script:not([src])").each((_, el) => {
      if (result) return
      const text = $(el).text()
      if (!text.includes("dataLayerContent")) return

      const match = text.match(/dataLayerContent\s*=\s*(\{[\s\S]*?\});\s*(?:dataLayer|$)/m)
      if (!match?.[1]) return

      try {
        // The object uses double-quoted keys already (it's valid JSON-like),
        // but property values may use single quotes or JS syntax.
        // Try JSON.parse first; it works on the observed fixtures.
        result = JSON.parse(match[1]) as EciDataLayerContent
      } catch {
        try {
          // Fallback: fix common JS->JSON issues (trailing commas, single quotes)
          const cleaned = match[1]
            .replace(/,\s*([}\]])/g, "$1")
            .replace(/'/g, '"')
          result = JSON.parse(cleaned) as EciDataLayerContent
        } catch {
          result = null
        }
      }
    })

    return result
  }

  private extractBarcode($: cheerio.CheerioAPI): string | null {
    // EAN is inside `.reference-container.pdp-reference`:
    //   <p>EAN: </p><span>9002490280567</span>
    const refContainer = $(".reference-container.pdp-reference")
    const spans = refContainer.find("span")
    for (let i = 0; i < spans.length; i++) {
      const text = $(spans[i]).text().trim()
      if (/^\d{8,14}$/.test(text)) return text
    }
    return null
  }

  /**
   * Builds pack string from dataLayer quantity + unit from the product name.
   * e.g. quantity="25", name="...lata 25 cl" -> "25 cl"
   */
  private extractPack(product: EciDataLayerProduct): string | null {
    if (!product.quantity || !product.name) return null

    const nameMatch = product.name.match(UNIT_PATTERN)
    if (nameMatch) {
      return `${nameMatch[1]} ${nameMatch[2]}`.trim()
    }

    return null
  }

  /**
   * Parses price-per-unit text like "(6,84 € / Litro)" or "(19,90 &euro; / Kg)"
   */
  private parsePricePerUnit(text: string | null): { pricePerUnit: string | null; majorUnit: string | null } {
    if (!text) return { pricePerUnit: null, majorUnit: null }

    const match = text.match(/\(?([\d.,]+)\s*(?:€|&euro;)\s*\/\s*(\w+)\)?/)
    if (!match) return { pricePerUnit: null, majorUnit: null }

    return {
      pricePerUnit: match[1].replace(",", "."),
      majorUnit: `/${match[2].toLowerCase()}`,
    }
  }
}

export const elCorteInglesScraper = new ElCorteInglesScraper()
