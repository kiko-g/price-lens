import axios from "axios"
import * as cheerio from "cheerio"
import type { SupermarketProduct } from "@/types"
import { NextResponse } from "next/server"

import { categories } from "./mock/continente"
import { isValidJson, packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"
import { productQueries } from "./db/queries/products"

export const fetchHtml = async (url: string) => {
  if (!url) {
    console.warn("URL is required. Skipping product.")
    return {}
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 5000,
    })

    if (!response.data) {
      console.warn("Empty response received. Skipping product.")
      return {}
    }

    return response.data
  } catch (error) {
    console.warn(`Failed to fetch HTML for URL ${url}:`, error)
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

export const continenteProductPageScraper = async (url: string) => {
  try {
    const html = await fetchHtml(url)
    if (!html || typeof html !== "string") {
      console.warn(`Failed to fetch HTML from: ${url}`)
      return {}
    }

    const $ = cheerio.load(html)

    const productDetailJson = $("#maincontent [data-product-detail-impression]").attr("data-product-detail-impression")
    if (!productDetailJson || !isValidJson(productDetailJson)) {
      console.warn(`Invalid or missing product detail JSON for URL: ${url}`)
      return {}
    }

    const root = ".product-images-container"
    let details
    try {
      details = JSON.parse(productDetailJson)
    } catch (jsonError) {
      console.warn(`Error parsing product detail JSON for URL: ${url}`, jsonError)
      return {}
    }

    const firstImage = $(".ct-product-image").first()
    const breadcrumbs =
      $(".breadcrumbs")
        .map((i, el) => $(el).text().trim())
        .get()
        .at(0)
        ?.split("\n")
        ?.map((item) => item?.trim() ?? "")
        .filter((item) => item !== "" && item !== "Página inicial") ?? []

    const rawProduct = {
      url,
      name: $(`${root} h1`).text().trim() || "Unknown Product",
      brand: $(`${root} .ct-pdp--brand`).text().trim() || "No Brand",
      pack: $(`${root} .ct-pdp--unit`).text().trim() || null,
      price: details?.items?.[0]?.price || $(`${root} .ct-price-formatted`).parent().attr("content") || null,
      price_recommended:
        details?.items?.[0]?.pre_discount_price || $(`${root} .pwc-discount-amount-pvpr`).text().trim() || null,
      price_per_major_unit:
        details?.items?.[0]?.price_per_major_unit || $(`${root} .ct-price-value`).text().trim() || null,
      major_unit: $(`${root} .ct-price-value`).siblings(".pwc-m-unit").text().replace(/\s+/g, " ").trim() || null,
      image: firstImage.attr("data-src") || firstImage.attr("src") || null,
      category: breadcrumbs[0] || null,
      category_2: breadcrumbs[1] || null,
      category_3: breadcrumbs[2] || null,
    }

    const price = rawProduct.price ? priceToNumber(rawProduct.price) : null
    const priceRecommended = rawProduct.price_recommended ? priceToNumber(rawProduct.price_recommended) : null
    const pricePerMajorUnit = rawProduct.price_per_major_unit ? priceToNumber(rawProduct.price_per_major_unit) : null

    const product: SupermarketProduct = {
      ...rawProduct,
      pack: rawProduct.pack ? packageToUnit(rawProduct.pack) : null,
      price: price || 0,
      price_recommended: priceRecommended || null,
      price_per_major_unit: pricePerMajorUnit || null,
      discount: priceRecommended ? Math.max(0, 1 - (price ?? 0) / priceRecommended) : 0,
      image: rawProduct.image ? resizeImgSrc(rawProduct.image, 500, 500) : null,
      updated_at: new Date().toISOString().replace("Z", "+00:00"),
      origin_id: 1,
      created_at: null,
    }

    return product
  } catch (error) {
    // Fail gracefully instead of breaking the route
    console.error(`Unexpected error in continenteProductPageScraper for URL: ${url}`, error)
    return {}
  }
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
      await productQueries.upsertBlank({
        url: link,
        created_at: new Date().toISOString().replace("Z", "+00:00"),
      })
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

export function isValidProduct(product: any): product is SupermarketProduct {
  return typeof product === "object" && product !== null && typeof product.url === "string"
}

export const scrapeAndReplaceProduct = async (url: string | null) => {
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  const product = await continenteProductPageScraper(url)

  if (!product || Object.keys(product).length === 0) {
    await productQueries.upsertBlank({
      url,
      created_at: new Date().toISOString().replace("Z", "+00:00"),
    })
    return NextResponse.json({ error: "SupermarketProduct scraping failed", url }, { status: 404 })
  }

  if (!isValidProduct(product)) {
    return NextResponse.json({ error: "Invalid product data structure", url }, { status: 422 })
  }

  const { data, error } = await productQueries.createOrUpdateProduct(product)

  if (error) {
    return NextResponse.json({ error: "Database operation failed", details: error }, { status: 500 })
  }

  return NextResponse.json({ product, data, message: "SupermarketProduct upserted" })
}
