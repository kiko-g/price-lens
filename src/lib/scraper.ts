import type { Product } from "@/types"
import * as cheerio from "cheerio"
import axios from "axios"

import { categories } from "./data/continente"
import { packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"
import { createEmptyProduct, createOrUpdateProduct } from "./supabase/actions"
import { createClient } from "./supabase/client"

export const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  })
  return response.text()
}

export const continenteProductPageScraper = async (url: string) => {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  if (!$(".ct-product-image").length) return {}

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
    name: $("h1").text().trim(),
    brand: $(".ct-pdp--brand").text().trim(),
    pack: $(".ct-pdp--unit").text().trim(),
    price: $(".ct-price-formatted").text().trim(),
    price_recommended: $(".pwc-discount-amount-pvpr").text().trim(),
    price_per_major_unit: $(".ct-price-value").text().trim(),
    major_unit: $(".ct-price-value").siblings(".pwc-m-unit").text().replace(/\s+/g, " ").trim(),
    image: $(".ct-product-image").attr("src") || "",
    category: breadcrumbs[0] || "",
    sub_category: breadcrumbs[1] || "",
    inner_category: breadcrumbs[2] || "",
  }

  const product: Product = {
    ...rawProduct,
    pack: packageToUnit(rawProduct.pack),
    price: priceToNumber(rawProduct.price),
    price_recommended: priceToNumber(rawProduct.price_recommended),
    price_per_major_unit: priceToNumber(rawProduct.price_per_major_unit),
    discount: 1 - priceToNumber(rawProduct.price) / priceToNumber(rawProduct.price_recommended),
    image: resizeImgSrc(rawProduct.image, 500, 500),
    updated_at: null,
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
    console.debug("Crawling", category.url)
    const start = performance.now()
    const links = await continenteCategoryPageScraper(category.url)
    console.debug("Finished scraping", category.name, links.length)
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
