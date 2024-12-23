import * as cheerio from "cheerio"
import type { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { packageToUnit, priceToNumber, resizeImgSrc } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const url = "https://www.continente.pt/produto/gelado-baunilha-e-brownie-de-caramelo-haagen-dazs-7931544.html"

  try {
    const rawResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    })

    const html = await rawResponse.text()
    const $ = cheerio.load(html)

    const rawProduct = {
      name: $("h1").text().trim(),
      brand: $(".ct-pdp--brand").text().trim(),
      pack: $(".ct-pdp--unit").text().trim(),
      price: $(".ct-price-formatted").text().trim(),
      priceRecommended: $(".pwc-discount-amount-pvpr").text().trim(),
      pricePerMajorUnit: $(".ct-price-value").text().trim(),
      majorUnit: $(".ct-price-value").siblings(".pwc-m-unit").text().replace(/\s+/g, " ").trim(),
      image: $(".ct-product-image").attr("src") || "",
    }

    const product: Product = {
      ...rawProduct,
      pack: packageToUnit(rawProduct.pack),
      price: priceToNumber(rawProduct.price),
      priceRecommended: priceToNumber(rawProduct.priceRecommended),
      pricePerMajorUnit: priceToNumber(rawProduct.pricePerMajorUnit),
      discount: priceToNumber(rawProduct.price) / priceToNumber(rawProduct.priceRecommended),
      image: resizeImgSrc(rawProduct.image, 500, 500),
    }

    return NextResponse.json({ ...product }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
