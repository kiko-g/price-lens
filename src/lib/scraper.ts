import type { Product } from "@/types"
import * as cheerio from "cheerio"

import { html as mockHtml } from "@/lib/data/html"
import { packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"

export const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  })
  return response.text()
}

export const continenteProductPageScraper = async (url: string) => {
  // const html = await fetchHtml(url)
  // const $ = cheerio.load(html)
  const $ = cheerio.load(mockHtml)

  const breadcrumbs = $(".breadcrumbs")
    .map((i, el) => $(el).text().trim())
    .get()[0]
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "" && item !== "Página inicial")

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
  }

  return product
}
