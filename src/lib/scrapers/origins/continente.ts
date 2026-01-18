import type * as cheerio from "cheerio"
import { BaseProductScraper } from "../base"
import { StoreOrigin, type RawProduct } from "../types"
import { extractJsonLd, isValidJson, resizeImgSrc } from "../utils"

interface ContinenteGtmItem {
  item_name?: string
  item_brand?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  price?: number
  pre_discount_price?: number
  price_per_major_unit?: number
}

interface ContinenteGtmData {
  items?: ContinenteGtmItem[]
}

/**
 * Scraper for Continente supermarket (origin_id: 1)
 */
export class ContinenteScraper extends BaseProductScraper {
  readonly originId = StoreOrigin.Continente
  readonly name = "Continente"

  /**
   * Detects when Continente redirects to homepage instead of returning 404
   * This happens when a product URL becomes unavailable
   */
  protected isSoftNotFound($: cheerio.CheerioAPI): boolean {
    // Check canonical URL - if it's the homepage, we got redirected
    const canonical = $('link[rel="canonical"]').attr("href")
    if (canonical) {
      try {
        const canonicalUrl = new URL(canonical)
        // Homepage canonical is just the root path or empty
        if (canonicalUrl.pathname === "/" || canonicalUrl.pathname === "") {
          return true
        }
      } catch {
        // Invalid URL, continue with other checks
      }
    }

    // Check for homepage-specific elements (Continente homepage has these)
    const hasHomepageCarousel = $(".homepage-carousel, .home-carousel, .hp-carousel").length > 0
    const hasHomepageBanners = $(".homepage-banners, .home-banners, .hp-banners").length > 0
    if (hasHomepageCarousel || hasHomepageBanners) {
      return true
    }

    // Product pages must have either GTM data or JSON-LD product data
    // If both are missing AND we have clear homepage indicators, it's a soft 404
    const hasGtmData = $("#maincontent [data-product-detail-impression]").length > 0
    const hasJsonLd = $('script[type="application/ld+json"]')
      .toArray()
      .some((el) => {
        try {
          const json = $(el).text()
          const parsed = JSON.parse(json)
          const items = Array.isArray(parsed) ? parsed : [parsed]
          return items.some((item) => item["@type"] === "Product")
        } catch {
          return false
        }
      })

    // If no product data indicators exist, likely redirected to homepage
    if (!hasGtmData && !hasJsonLd) {
      // Double-check by looking for product page structure
      const hasProductStructure = $(".product-images-container, .ct-pdp--info, .pdp-main").length > 0
      if (!hasProductStructure) {
        return true
      }
    }

    return false
  }

  protected async extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null> {
    const jsonLd = extractJsonLd($)
    const gtmData = this.extractGtmData($)
    const gtmItem = gtmData?.items?.[0]

    if (!jsonLd && !gtmItem) {
      return null
    }

    const root = ".product-images-container"
    const breadcrumbs = this.extractBreadcrumbs($, gtmItem)
    const image = this.extractImage($, jsonLd)

    return {
      url,
      name: this.extractName($, jsonLd, gtmItem, root),
      brand: this.extractBrand($, jsonLd, gtmItem, root),
      barcode: this.extractBarcode($, jsonLd),
      pack: this.extractPack($, root),
      price: this.extractPrice(jsonLd, gtmItem, $, root),
      priceRecommended: this.extractPriceRecommended($, gtmItem, root),
      pricePerMajorUnit: this.extractPricePerUnit($, gtmItem, root),
      majorUnit: this.extractMajorUnit($, root),
      image: image ? resizeImgSrc(image, 500, 500) : null,
      category: gtmItem?.item_category || breadcrumbs[0] || null,
      category2: gtmItem?.item_category2 || breadcrumbs[1] || null,
      category3: gtmItem?.item_category3 || breadcrumbs[2] || null,
    }
  }

  private extractPack($: cheerio.CheerioAPI, root?: string): string | null {
    const text = this.getText($, `${root} .ct-pdp--unit`)
    return text
  }

  private extractGtmData($: cheerio.CheerioAPI): ContinenteGtmData | null {
    const json = this.getAttr($, "#maincontent [data-product-detail-impression]", "data-product-detail-impression")
    if (!json || !isValidJson(json)) return null
    try {
      return JSON.parse(json) as ContinenteGtmData
    } catch {
      return null
    }
  }

  private extractBreadcrumbs($: cheerio.CheerioAPI, gtmItem?: ContinenteGtmItem): string[] {
    if (gtmItem?.item_category) return []

    const text = $(".breadcrumbs").first().text().trim()
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item !== "" && item !== "Página inicial")
  }

  private extractImage($: cheerio.CheerioAPI, jsonLd: Record<string, unknown> | null): string | null {
    const jsonLdImage = jsonLd?.image
    const imageFromJsonLd = Array.isArray(jsonLdImage) ? jsonLdImage[0] : (jsonLdImage as string | undefined)
    const firstImage = $(".ct-product-image").first()
    const imageFromDom = firstImage.attr("data-src") || firstImage.attr("src") || null
    return imageFromJsonLd || imageFromDom || null
  }

  private extractName(
    $: cheerio.CheerioAPI,
    jsonLd: Record<string, unknown> | null,
    gtmItem?: ContinenteGtmItem,
    root?: string,
  ): string {
    return (jsonLd?.name as string) || gtmItem?.item_name || this.getText($, `${root} h1`) || "Unknown Product"
  }

  private extractBrand(
    $: cheerio.CheerioAPI,
    jsonLd: Record<string, unknown> | null,
    gtmItem?: ContinenteGtmItem,
    root?: string,
  ): string | null {
    const jsonLdBrand = (jsonLd?.brand as Record<string, unknown>)?.name as string | undefined
    return jsonLdBrand || gtmItem?.item_brand || this.getText($, `${root} .ct-pdp--brand`)
  }

  private extractBarcode($: cheerio.CheerioAPI, jsonLd: Record<string, unknown> | null): string | null {
    const nutritionalUrl = $("a.js-nutritional-tab-anchor").attr("data-url")
    if (nutritionalUrl) {
      const eanMatch = nutritionalUrl.match(/ean=(\d+)/)
      if (eanMatch) return eanMatch[1]
    }

    // Try JSON-LD (gtin, gtin13, gtin8, sku)
    const gtin = (jsonLd?.gtin13 || jsonLd?.gtin || jsonLd?.gtin8 || jsonLd?.sku) as string | undefined
    if (gtin) return gtin

    // Try meta tags
    const metaGtin = this.getAttr($, 'meta[property="product:gtin"]', "content")
    if (metaGtin) return metaGtin

    // Try data attributes
    const dataEan = this.getAttr($, "[data-ean]", "data-ean")
    if (dataEan) return dataEan

    return null
  }

  private extractPrice(
    jsonLd: Record<string, unknown> | null,
    gtmItem?: ContinenteGtmItem,
    $?: cheerio.CheerioAPI,
    root?: string,
  ): string | number | null {
    const offers = jsonLd?.offers as Record<string, unknown> | undefined
    if (offers?.price) return offers.price as string | number
    if (gtmItem?.price) return gtmItem.price
    if ($) return this.getAttr($, `${root} .ct-price-formatted`, "content")
    return null
  }

  private extractPriceRecommended(
    $: cheerio.CheerioAPI,
    gtmItem?: ContinenteGtmItem,
    root?: string,
  ): string | number | null {
    return gtmItem?.pre_discount_price || this.getText($, `${root} .pwc-discount-amount-pvpr`)
  }

  private extractPricePerUnit(
    $: cheerio.CheerioAPI,
    gtmItem?: ContinenteGtmItem,
    root?: string,
  ): string | number | null {
    if (gtmItem?.price_per_major_unit) return gtmItem.price_per_major_unit

    const text = this.getText($, `${root} .pwc-tile--price-secondary`)
    if (!text) return null

    // Text format: "63,12€/kg" - extract price before €
    const priceMatch = text.match(/^([\d.,]+)/)
    if (!priceMatch) return null

    // Convert European format (comma as decimal) to number
    const priceStr = priceMatch[1].replace(",", ".")
    const price = parseFloat(priceStr)
    return isNaN(price) ? null : price
  }

  private extractMajorUnit($: cheerio.CheerioAPI, root: string): string | null {
    const text = this.getText($, `${root} .pwc-tile--price-secondary`)
    if (!text) return null

    // Text format: "63,12€/kg" - extract unit after /
    const unitMatch = text.match(/\/(.+)$/)
    return unitMatch ? unitMatch[1].trim() : null
  }
}

export const continenteScraper = new ContinenteScraper()
