import type * as cheerio from "cheerio"
import { BaseProductScraper } from "../base"
import { StoreOrigin, type RawProduct } from "../types"
import { isValidJson, resizeImgSrc } from "../utils"

interface PingoDoceGtmItem {
  item_name?: string
  item_brand?: string
  price?: number
}

interface PingoDoceGtmData {
  items?: PingoDoceGtmItem[]
}

/**
 * Scraper for Pingo Doce supermarket (origin_id: 3)
 */
export class PingoDoceScraper extends BaseProductScraper {
  readonly originId = StoreOrigin.PingoDoce
  readonly name = "PingoDoce"

  /**
   * Detects Pingo Doce's soft 404 page or unavailable products
   * Both cases should preserve existing data and just mark as unavailable
   */
  protected isSoftNotFound($: cheerio.CheerioAPI): boolean {
    const hasError404Text = $("body").text().includes("Erro 404")
    const hasNotFoundText = $("body").text().includes("não conseguimos encontrar o que procura")
    const isUnavailable = $(".product-unavailable").length > 0 || $(".btn-product-unavailable").length > 0
    return hasError404Text || hasNotFoundText || isUnavailable
  }

  protected async extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null> {
    const gtmData = this.extractGtmData($)
    const gtmItem = gtmData?.items?.[0]

    if (!gtmItem) {
      return null
    }

    const subText = this.getText($, ".product-unit-measure")?.split(" | ") || []
    const [pack, pricePerMajorUnitStr] = subText
    const majorUnit = this.extractMajorUnit(pricePerMajorUnitStr)
    const pricePerMajorUnit = this.extractPricePerUnit(pricePerMajorUnitStr)
    const categories = this.extractCategoriesFromUrl(url)

    return {
      url,
      name: gtmItem.item_name || null,
      brand: gtmItem.item_brand || null,
      barcode: this.extractBarcode($),
      pack: pack || null,
      price: gtmItem.price || null,
      priceRecommended: this.getAttr($, ".product-wrapper .prices .price .strike-through .value", "content"),
      pricePerMajorUnit,
      majorUnit,
      image: this.extractImage($),
      category: categories.category,
      category2: categories.category2,
      category3: categories.category3,
    }
  }

  private extractGtmData($: cheerio.CheerioAPI): PingoDoceGtmData | null {
    const json = this.getAttr($, ".product-detail.product-wrapper", "data-gtm-info")
    if (!json || !isValidJson(json)) return null
    try {
      return JSON.parse(json) as PingoDoceGtmData
    } catch {
      return null
    }
  }

  private extractBarcode($: cheerio.CheerioAPI): string | null {
    // Try common barcode locations for Pingo Doce
    const dataEan = this.getAttr($, "[data-ean]", "data-ean")
    if (dataEan) return dataEan

    const metaGtin = this.getAttr($, 'meta[property="product:gtin"]', "content")
    if (metaGtin) return metaGtin

    // Try product info section
    const productInfo = this.getAttr($, ".product-detail", "data-product-ean")
    if (productInfo) return productInfo

    return null
  }

  private extractMajorUnit(pricePerMajorUnitStr?: string): string | null {
    if (!pricePerMajorUnitStr) return null
    const match = pricePerMajorUnitStr.match(/€\s*\/\s*([A-Za-z]+)/i)
    return match ? `/${match[1].toLowerCase()}` : null
  }

  private extractPricePerUnit(pricePerMajorUnitStr?: string): string | null {
    if (!pricePerMajorUnitStr) return null
    const match = pricePerMajorUnitStr.match(/^([\d,.]+)/)
    return match?.[1] || null
  }

  private extractCategoriesFromUrl(url: string): {
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
      const category3Raw = pathParts[produtosIdx + 4] ? pathParts[produtosIdx + 3] : null

      return {
        category: this.normalizeCategory(categoryRaw),
        category2: this.normalizeCategory(category2Raw),
        category3: this.normalizeCategory(category3Raw),
      }
    } catch {
      return { category: null, category2: null, category3: null }
    }
  }

  private normalizeCategory(categoryRaw: string | null): string | null {
    if (!categoryRaw) return null
    return categoryRaw
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  private extractImage($: cheerio.CheerioAPI): string | null {
    const src = this.getAttr($, ".primary-images .carousel-inner img", "src")
    return src ? resizeImgSrc(src, 500, 500) : null
  }
}

export const pingoDoceScraper = new PingoDoceScraper()
