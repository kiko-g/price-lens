import type * as cheerio from "cheerio"
import { BaseProductScraper } from "../base"
import { StoreOrigin, type RawProduct } from "../types"
import { formatProductName, priceToNumber, resizeImgSrc } from "../utils"

export type ScrapedSchemaAuchan = {
  "@context": string
  "@type": string
  "@id": string
  name: string
  description: string
  sku: string
  gtin: string
  brand: {
    "@type": "Brand"
    name: string
  }
  image: string[]
  offers: {
    url: Record<string, unknown>
    "@type": "Offer"
    priceCurrency: string
    priceValidUntil: string
    price: string
    pricevaliduntil: string
    availability: string
  }
}

export interface ScrapedAddOnAuchan {
  event: string
  ecommerce: {
    value: number
    currency: string
    items: Array<{
      item_id: string
      item_name: string
      item_brand: string
      item_category: string
      affiliation: string
      coupon: string
      location_id: string
      item_list_id: string
      item_list_name: string
      item_variant: string
      item_category2: string
      item_category3: string
      item_category4: string
      quantity: string
      price: string
      discount: string
      index: number
    }>
  }
}

/**
 * Scraper for Auchan supermarket (origin_id: 2)
 */
export class AuchanScraper extends BaseProductScraper {
  readonly originId = StoreOrigin.Auchan
  readonly name = "Auchan"

  /**
   * Detects Auchan's soft 404 page (HTTP 200 with "Não temos o que procura" content)
   */
  protected isSoftNotFound($: cheerio.CheerioAPI): boolean {
    // Check for the "Oops" error page indicators
    const hasNotFoundText = $("body").text().includes("Não temos o que procura")
    const has404Image = $('img[alt*="404"]').length > 0
    const hasTryAgainText = $("body").text().includes("Vamos tentar de novo")
    return hasNotFoundText || has404Image || hasTryAgainText
  }

  protected async extractRawProduct($: cheerio.CheerioAPI, url: string): Promise<RawProduct | null> {
    const schema = this.extractSchema($)
    const addOn = this.extractAddOn($)

    if (!schema || !addOn) {
      return null
    }

    const item = addOn.ecommerce.items[0]
    const pricePerMajorUnitStr = this.getText($, ".auc-measures--price-per-unit")
    const majorUnit = pricePerMajorUnitStr?.split("/").pop() || null

    return {
      url,
      name: formatProductName(schema.name),
      brand: formatProductName(schema.brand?.name),
      barcode: this.extractBarcode(schema),
      pack: this.getText($, ".attribute-values.auc-pdp-regular"),
      price: schema.offers?.price || null,
      priceRecommended: item.price ? priceToNumber(item.price) : null,
      pricePerMajorUnit: pricePerMajorUnitStr,
      majorUnit,
      image: this.extractImage($, schema),
      category: item.item_category || null,
      category2: item.item_category2 || null,
      category3: item.item_category3 || null,
    }
  }

  private extractSchema($: cheerio.CheerioAPI): ScrapedSchemaAuchan | null {
    const jsonSchemaRaw = $('script[type="application/ld+json"]').text().trim()
    if (!jsonSchemaRaw) return null

    try {
      const cleaned = jsonSchemaRaw.trim().replace(/^'|'$/g, "")
      // Handle concatenated JSON objects
      const parsed = this.parseJsonLd(cleaned)
      return parsed
    } catch {
      return null
    }
  }

  private parseJsonLd(str: string): ScrapedSchemaAuchan | null {
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) {
        return parsed.find((item) => item["@type"] === "Product") || null
      }
      return parsed["@type"] === "Product" ? parsed : null
    } catch {
      // Try handling concatenated objects
      try {
        const fixed = "[" + str.replace(/}\s*{/g, "},{") + "]"
        const arr = JSON.parse(fixed)
        return arr.find((item: Record<string, unknown>) => item["@type"] === "Product") || arr[0]
      } catch {
        return null
      }
    }
  }

  private extractAddOn($: cheerio.CheerioAPI): ScrapedAddOnAuchan | null {
    const raw = this.getAttr($, 'input[name="gtmOnLoad"]', "value")
    if (!raw) return null

    try {
      const cleaned = raw.trim().replace(/^'|'$/g, "")
      return JSON.parse(cleaned) as ScrapedAddOnAuchan
    } catch {
      return null
    }
  }

  private extractBarcode(schema: ScrapedSchemaAuchan): string | null {
    // Auchan provides GTIN in the schema
    return schema.gtin || schema.sku || null
  }

  private extractImage($: cheerio.CheerioAPI, schema: ScrapedSchemaAuchan): string | null {
    const imageSrcMain = schema.image?.[0]
    const imageUrlMain = imageSrcMain ? resizeImgSrc(imageSrcMain, 500, 500) : null

    const imageSrcFallback = this.getAttr($, ".auc-carousel__thumbnail-image", "src")
    const imageUrlFallback = imageSrcFallback ? resizeImgSrc(imageSrcFallback, 500, 500) : null

    const imageUrlAppendix = "?sw=500&sh=500&sm=fit&bgcolor=FFFFFF"
    let imageUrl = imageUrlMain || imageUrlFallback || null

    if (imageUrl && !imageUrl.includes("?")) {
      imageUrl += imageUrlAppendix
    }

    return imageUrl
  }
}

export const auchanScraper = new AuchanScraper()
