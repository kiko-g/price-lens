import axios from "axios"
import * as cheerio from "cheerio"
import https from "https"
import type { StoreProduct } from "@/types"
import { NextResponse } from "next/server"

import { categories } from "./mock/continente"
import { formatProductName, isValidJson, now, packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"
import { storeProductQueries } from "./db/queries/products"
import { ScrapedAddOnAuchan, ScrapedSchemaAuchan } from "@/types/extra"

/**
 * Connection pooling agent - reuses TCP connections to reduce handshake overhead
 * keepAlive: true - reuse sockets for multiple requests
 * maxSockets: 50 - allow up to 50 concurrent connections per host
 * timeout: 30000 - socket idle timeout (30s)
 */
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000,
})

/**
 * Realistic browser User-Agent to avoid bot detection
 */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/**
 * Tracking parameters to strip from URLs (reduces URL length and avoids cache busting)
 */
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
 * Strips tracking/analytics parameters from URLs
 * This reduces URL length and can improve caching
 */
export const cleanUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    TRACKING_PARAMS.forEach((param) => urlObj.searchParams.delete(param))
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * Pre-configured axios instance with optimized settings:
 * - Connection pooling via httpsAgent
 * - Compression support (gzip, deflate, br)
 * - Realistic headers
 * - Automatic decompression
 */
const httpClient = axios.create({
  httpsAgent,
  timeout: 8000,
  headers: {
    "User-Agent": USER_AGENT,
    "Accept-Encoding": "gzip, deflate, br",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  },
  decompress: true, // Automatically decompress responses
})

export const fetchHtml = async (url: string) => {
  if (!url) {
    console.warn("URL is required. Skipping product.")
    return {}
  }

  const cleanedUrl = cleanUrl(url)
  try {
    const response = await httpClient.get(cleanedUrl)

    if (!response.data) {
      console.warn("Empty response received. Skipping product.")
      return {}
    }

    return response.data
  } catch (error) {
    console.warn(`Failed to fetch HTML for URL ${cleanedUrl}:`, error)
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        console.warn("Request timed out. Skipping product.")
      } else {
        console.warn(error.message)
      }
    }
    return {}
  }
}

/**
 * Extracts JSON-LD structured data from HTML (faster extraction method)
 * JSON-LD contains pre-structured product data easier to parse
 */
const extractJsonLd = ($: cheerio.CheerioAPI): Record<string, unknown> | null => {
  try {
    const jsonLdScript = $('script[type="application/ld+json"]').first().text().trim()
    if (!jsonLdScript) return null

    const parsed = JSON.parse(jsonLdScript)
    // Handle both single object and array of objects
    if (Array.isArray(parsed)) {
      return parsed.find((item) => item["@type"] === "Product") || null
    }
    return parsed["@type"] === "Product" ? parsed : null
  } catch {
    return null
  }
}

const continenteProductPageScraper = async (url: string, prevSp?: StoreProduct) => {
  const priority = prevSp?.priority ?? null
  const cleanedUrl = cleanUrl(url)

  try {
    const html = await fetchHtml(url)
    if (!html || typeof html !== "string") {
      console.warn(`Failed to fetch HTML from: ${url}`)
      return {}
    }

    const $ = cheerio.load(html)
    const jsonLd = extractJsonLd($)

    // Get data-product-detail-impression for rich GTM data (categories, etc.)
    const productDetailJson = $("#maincontent [data-product-detail-impression]").attr("data-product-detail-impression")
    let details: Record<string, unknown> | null = null
    if (productDetailJson && isValidJson(productDetailJson)) {
      try {
        details = JSON.parse(productDetailJson)
      } catch {
        console.warn(`Error parsing product detail JSON for URL: ${url}. Continuing with other sources.`)
      }
    }

    // If neither source is available, fail gracefully
    if (!jsonLd && !details) {
      console.warn(`Invalid or missing product data for URL: ${url}`)
      return {}
    }

    const root = ".product-images-container"
    const detailsItem = (details as Record<string, unknown> & { items?: Record<string, unknown>[] })?.items?.[0]
    const breadcrumbs = detailsItem?.item_category
      ? []
      : ($(".breadcrumbs")
          .map((i, el) => $(el).text().trim())
          .get()
          .at(0)
          ?.split("\n")
          ?.map((item) => item?.trim() ?? "")
          .filter((item) => item !== "" && item !== "Página inicial") ?? [])

    const firstImage = $(".ct-product-image").first()
    // JSON-LD image can be a string or array of strings
    const jsonLdImage = jsonLd?.image
    const imageFromJsonLd = Array.isArray(jsonLdImage) ? jsonLdImage[0] : (jsonLdImage as string | undefined)
    const imageFromDom = firstImage.attr("data-src") || firstImage.attr("src") || null
    const image = imageFromJsonLd || imageFromDom

    // Build raw product with data fusion (JSON-LD + GTM details + DOM fallback)
    const rawProduct = {
      url: cleanedUrl,
      name:
        (jsonLd?.name as string) ||
        (detailsItem?.item_name as string) ||
        $(`${root} h1`).text().trim() ||
        "Unknown Product",
      brand:
        ((jsonLd?.brand as Record<string, unknown>)?.name as string) ||
        (detailsItem?.item_brand as string) ||
        $(`${root} .ct-pdp--brand`).text().trim() ||
        "",
      pack: $(`${root} .ct-pdp--unit`).text().trim() || null,
      price:
        (jsonLd?.offers as Record<string, unknown>)?.price ||
        detailsItem?.price ||
        $(`${root} .ct-price-formatted`).parent().attr("content") ||
        null,
      price_recommended:
        (detailsItem?.pre_discount_price as number) || $(`${root} .pwc-discount-amount-pvpr`).text().trim() || null,
      price_per_major_unit:
        (detailsItem?.price_per_major_unit as number) || $(`${root} .ct-price-value`).text().trim() || null,
      major_unit: $(`${root} .ct-price-value`).siblings(".pwc-m-unit").text().replace(/\s+/g, " ").trim() || null,
      image: image,
      category: (detailsItem?.item_category as string) || breadcrumbs[0] || null,
      category_2: (detailsItem?.item_category2 as string) || breadcrumbs[1] || null,
      category_3: (detailsItem?.item_category3 as string) || breadcrumbs[2] || null,
    }

    const price = rawProduct.price ? priceToNumber(String(rawProduct.price)) : null
    const priceRecommended = rawProduct.price_recommended ? priceToNumber(String(rawProduct.price_recommended)) : price
    const pricePerMajorUnit = rawProduct.price_per_major_unit
      ? priceToNumber(String(rawProduct.price_per_major_unit))
      : null
    const discount = priceRecommended ? Math.max(0, 1 - (price ?? 0) / priceRecommended) : 0

    const sp: Omit<StoreProduct, "id" | "product_id"> = {
      ...rawProduct,
      pack: rawProduct.pack ? packageToUnit(rawProduct.pack) : null,
      price: price || 0,
      price_recommended: priceRecommended || null,
      price_per_major_unit: pricePerMajorUnit || null,
      discount: discount,
      image: rawProduct.image ? resizeImgSrc(rawProduct.image, 500, 500) : null,
      updated_at: now(),
      origin_id: 1,
      created_at: "",
      priority,
    }

    return sp
  } catch (error) {
    // Fail gracefully instead of breaking the route
    console.warn(`Unexpected error in continenteProductPageScraper for URL: ${url}`, error)
    return {}
  }
}

const auchanProductPageScraper = async (url: string, prevSp?: StoreProduct) => {
  const priority = prevSp?.priority ?? null

  try {
    const html = await fetchHtml(url)
    if (!html || typeof html !== "string") {
      console.warn(`Failed to fetch HTML from: ${url}`)
      return {}
    }

    const $ = cheerio.load(html)
    const jsonSchemaRaw = $('script[type="application/ld+json"]').text().trim()
    if (!jsonSchemaRaw) {
      console.warn(`Invalid or missing product detail JSON for URL: ${url}`)
      return {}
    }

    const jsonAddOnRaw = $('input[name="gtmOnLoad"]').attr("value")
    if (!jsonAddOnRaw) {
      console.warn(`Invalid or missing product detail JSON for URL: ${url}`)
      return {}
    }

    const clean = (s: string) => s.trim().replace(/^'|'$/g, "")
    const parseConcat = (s: string) => {
      s = clean(s)
      try {
        return JSON.parse(s)
      } catch {
        return JSON.parse("[" + s.replace(/}\s*{/g, "},{") + "]")
      }
    }

    let addOn: ScrapedAddOnAuchan
    let schema: ScrapedSchemaAuchan | null = null
    try {
      addOn = JSON.parse(clean(jsonAddOnRaw))
      schema = parseConcat(jsonSchemaRaw)
    } catch (jsonError) {
      console.warn(`Error parsing product detail JSON for URL: ${url}`, jsonError)
      return {}
    }

    const pricePerMajorUnitStr = $(".auc-measures--price-per-unit").first().text().trim()
    const pricePerMajorUnit = pricePerMajorUnitStr ? priceToNumber(pricePerMajorUnitStr) : null
    const majorUnit = pricePerMajorUnitStr.split("/")[pricePerMajorUnitStr.split("/").length - 1]
    const item = addOn.ecommerce.items[0]

    const imageSrcMain = schema?.image?.[0]
    const imageUrlMain = imageSrcMain ? resizeImgSrc(imageSrcMain, 500, 500) : null
    const imageSrcFallback = $(".auc-carousel__thumbnail-image").first().attr("src")
    const imageUrlFallback = imageSrcFallback ? resizeImgSrc(imageSrcFallback, 500, 500) : null
    const imageUrlAppendix = `?sw=500&sh=500&sm=fit&bgcolor=FFFFFF`
    let imageUrl = imageUrlMain || imageUrlFallback || null
    if (!imageUrl?.includes("?")) imageUrl += imageUrlAppendix

    const rawProduct = {
      url,
      name: formatProductName(schema?.name),
      brand: formatProductName(schema?.brand?.name),
      pack: $(".attribute-values.auc-pdp-regular").first().text().trim() || null,
      price: schema?.offers?.price || null,
      price_recommended: priceToNumber(item.price) || null,
      price_per_major_unit: pricePerMajorUnitStr || null,
      major_unit: majorUnit || null,
      image: imageUrl,
      category: item.item_category || null,
      category_2: item.item_category2 || null,
      category_3: item.item_category3 || null,
    }

    const price = rawProduct.price ? priceToNumber(rawProduct.price.toString()) : null
    const priceRecommended = rawProduct.price_recommended
      ? priceToNumber(rawProduct.price_recommended.toString())
      : price
    const discount = priceRecommended ? Math.max(0, 1 - (price ?? 0) / priceRecommended) : 0

    const sp: Omit<StoreProduct, "id" | "product_id"> = {
      ...rawProduct,
      pack: rawProduct.pack ? packageToUnit(rawProduct.pack) : null,
      price: price || 0,
      price_recommended: priceRecommended || null,
      price_per_major_unit: pricePerMajorUnit || null,
      discount: discount,
      image: rawProduct.image ? resizeImgSrc(rawProduct.image, 500, 500) : null,
      updated_at: now(),
      origin_id: 2,
      created_at: "",
      priority,
    }

    return sp
  } catch (error) {
    // Fail gracefully instead of breaking the route
    console.error(`Unexpected error in auchanProductPageScraper for URL: ${url}`, error)
    return {}
  }
}

const pingoDoceProductPageScraper = async (url: string, prevSp?: StoreProduct) => {
  const priority = prevSp?.priority ?? null

  try {
    const html = await fetchHtml(url)
    if (!html || typeof html !== "string") {
      console.warn(`Failed to fetch HTML from: ${url}`)
      return {}
    }

    const $ = cheerio.load(html)
    const productJsonAttr = $(".product-detail.product-wrapper").attr("data-gtm-info")
    if (!productJsonAttr || !isValidJson(productJsonAttr)) {
      console.warn(`Invalid or missing product detail JSON for URL: ${url}`)
      return {}
    }

    const productJson = JSON.parse(productJsonAttr).items[0]
    const subText = $(".product-unit-measure").first().text().trim().split(" | ")
    const [pack, pricePerMajorUnitStr] = subText // e.g. [ "0.4 Kg", "5,73 €/Kg" ]
    const majorUnit = `/${pricePerMajorUnitStr?.match(/€\s*\/\s*([A-Za-z]+)/i)?.[1]?.toLowerCase()}` || null
    const pricePerMajorUnitRaw = pricePerMajorUnitStr?.match(/^([\d,.]+)/)?.[1] || null

    let categoryRaw: string | null = null
    let category_2Raw: string | null = null
    let category_3Raw: string | null = null
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split("/").filter(Boolean)
      const produtosIdx = pathParts.findIndex((p) => p === "produtos")
      if (produtosIdx !== -1) {
        categoryRaw = pathParts[produtosIdx + 1] ?? null
        category_2Raw = pathParts[produtosIdx + 2] ?? null
        category_3Raw = pathParts[produtosIdx + 4] ? pathParts[produtosIdx + 3] : null
      }
    } catch {
      console.warn("Failed to parse categories from URL:", url)
    }

    const normalizeCategory = (categoryRaw: string | null): string | null => {
      if (!categoryRaw) return null
      return categoryRaw
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    const category = normalizeCategory(categoryRaw)
    const category_2 = normalizeCategory(category_2Raw)
    const category_3 = normalizeCategory(category_3Raw)

    const rawProduct = {
      url,
      name: productJson.item_name || "",
      brand: productJson.item_brand || "",
      pack: pack || null,
      price: productJson.price || null,
      price_recommended: $(".product-wrapper .prices .price .strike-through .value").attr("content") || null,
      price_per_major_unit: pricePerMajorUnitRaw || null,
      major_unit: majorUnit || null,
      image: $(".primary-images .carousel-inner img").first().attr("src"),
      category,
      category_2,
      category_3,
    }

    const price = rawProduct.price ? priceToNumber(rawProduct.price.toString()) : null
    const priceRecommended = rawProduct.price_recommended
      ? priceToNumber(rawProduct.price_recommended.toString())
      : price
    const pricePerMajorUnit = pricePerMajorUnitRaw ? priceToNumber(pricePerMajorUnitRaw) : null
    const discount = priceRecommended ? Math.max(0, 1 - (price ?? 0) / priceRecommended) : 0

    const sp: Omit<StoreProduct, "id" | "product_id"> = {
      ...rawProduct,
      pack: rawProduct.pack ? packageToUnit(rawProduct.pack) : null,
      price: price || 0,
      price_recommended: priceRecommended || null,
      price_per_major_unit: pricePerMajorUnit || null,
      discount: discount,
      image: rawProduct.image ? resizeImgSrc(rawProduct.image, 500, 500) : null,
      updated_at: now(),
      origin_id: 3,
      created_at: "",
      priority,
    }

    return sp
  } catch (error) {
    // Fail grace fully instead of breaking the route
    console.error(`Unexpected error in pingoDoceProductPageScraper for URL: ${url}`, error)
    return {}
  }
}

export const getScraper = (origin: number) => {
  switch (origin) {
    case 1:
      return Scrapers.continente
    case 2:
      return Scrapers.auchan
    case 3:
      return Scrapers.pingoDoce
    default:
      throw new Error(`Unknown origin id: ${origin}`)
  }
}

export const Scrapers = {
  continente: {
    productPage: continenteProductPageScraper,
  },
  auchan: {
    productPage: auchanProductPageScraper,
  },
  pingoDoce: {
    productPage: pingoDoceProductPageScraper,
  },
}

export const continenteCategoryPageScraper = async (url: string): Promise<string[]> => {
  const links: string[] = []

  const getPaginatedUrl = (url: string, start: number): string => {
    if (url.includes("?start=")) return url.replace(/(\?start=)\d+/, `$1${start}`)
    else {
      const separator = url.includes("?") ? "&" : "?"
      return `${url}${separator}start=${start}`
    }
  }

  const grabLinksInPage = ($: cheerio.CheerioAPI): string[] => {
    const pageLinks: string[] = []
    $(".product-tile").each((index, element) => {
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

export const crawlContinenteCategoryPages = async () => {
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

export const batchUrls = (urls: string[], batchSize: number) => {
  const batches = []
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize))
  }
  return batches
}

export const processBatch = async (urls: string[]) => {
  const products = await Promise.all(
    urls.map((url) => continenteProductPageScraper(url).catch((err) => ({ url, error: err }))),
  )
  return products
}

export function isValidProduct(product: unknown): product is StoreProduct {
  return (
    typeof product === "object" &&
    product !== null &&
    "url" in product &&
    typeof (product as Record<string, unknown>).url === "string"
  )
}

export const scrapeAndReplaceProduct = async (url: string | null, origin: number | null, prevSp?: StoreProduct) => {
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 })

  if (!origin) return NextResponse.json({ error: "Origin ID is required" }, { status: 400 })

  const product = await getScraper(origin).productPage(url, prevSp)

  if (!product || Object.keys(product).length === 0) {
    await storeProductQueries.upsertBlank({ url })
    return NextResponse.json({ error: "StoreProduct scraping failed", url }, { status: 404 })
  }

  if (!isValidProduct(product)) return NextResponse.json({ error: "Invalid product data", url }, { status: 422 })

  const { data, error } = await storeProductQueries.createOrUpdateProduct(product)

  if (error) {
    return NextResponse.json({ data, error: "StoreProduct upsert failed", details: error, product }, { status: 500 })
  }

  return NextResponse.json({ data: product, message: "StoreProduct upserted" })
}
