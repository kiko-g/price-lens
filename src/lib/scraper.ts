import type { Product } from "@/types"
import * as cheerio from "cheerio"
import axios from "axios"

import { categories } from "./data/continente"
import { isValidJson, packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"
import { createEmptyProduct, createOrUpdateProduct } from "./supabase/actions"
import { createClient } from "./supabase/client"

export const fetchHtml = async (url: string) => {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  })
  return response.data
}

export const continenteProductPageScraper = async (url: string) => {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const productDetailJson = $("#maincontent [data-product-detail-impression]").attr("data-product-detail-impression")
  if (!productDetailJson || !isValidJson(productDetailJson)) return {}

  const root = ".product-images-container"
  const details = JSON.parse(productDetailJson)

  const firstImage = $(".ct-product-image").first()
  if (!firstImage.length) return {}

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
    name: $(`${root} h1`).text().trim(),
    brand: $(`${root} .ct-pdp--brand`).text().trim(),
    pack: $(`${root} .ct-pdp--unit`).text().trim(),
    price: details.items[0].price || $(`${root} .ct-price-formatted`).parent().attr("content") || "",
    price_recommended:
      details.items[0].pre_discount_price || $(`${root} .pwc-discount-amount-pvpr`).text().trim() || null,
    price_per_major_unit: details.items[0].price_per_major_unit || $(`${root} .ct-price-value`).text().trim() || null,
    major_unit: $(`${root} .ct-price-value`).siblings(".pwc-m-unit").text().replace(/\s+/g, " ").trim() || null,
    image: $(`${root} .ct-product-image`).attr("data-src") || $(`${root} .ct-product-image`).attr("src") || null,
    category: breadcrumbs[0] || null,
    category_2: breadcrumbs[1] || null,
    category_3: breadcrumbs[2] || null,
  }

  console.debug(rawProduct.image)
  const price = priceToNumber(rawProduct.price)
  const priceRecommended = rawProduct.price_recommended ? priceToNumber(rawProduct.price_recommended) : null
  const pricePerMajorUnit = rawProduct.price_per_major_unit ? priceToNumber(rawProduct.price_per_major_unit) : null

  const product: Product = {
    ...rawProduct,
    pack: packageToUnit(rawProduct.pack),
    price,
    price_recommended: priceRecommended,
    price_per_major_unit: pricePerMajorUnit,
    discount: !priceRecommended ? 0 : 1 - price / priceRecommended,
    image: rawProduct.image ? resizeImgSrc(rawProduct.image, 500, 500) : null,
    updated_at: new Date().toISOString().replace("Z", "+00:00"),
    created_at: null,
  }

  return product
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

  const fetchHtml = async (url: string): Promise<string> => {
    const response = await axios.get(url)
    return response.data
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
      const product = createEmptyProduct()
      product.url = link
      await createOrUpdateProduct(product)
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

export const createOrUpdateProducts = async (products: Product[]) => {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").upsert(products)
  return { data, error }
}
