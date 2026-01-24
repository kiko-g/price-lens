import { NextRequest, NextResponse } from "next/server"
import { getScraper } from "@/lib/scrapers"
import { storeProductQueries } from "@/lib/queries/products"
import { StoreProduct } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const { origin } = new URL(url)
    let originInt
    if (origin.includes("continente")) originInt = 1
    else if (origin.includes("auchan")) originInt = 2
    else if (origin.includes("pingodoce")) originInt = 3
    else return NextResponse.json({ error: "Unknown store origin" }, { status: 400 })

    // sp.url and sp.name already exists
    const { data: existing, error: existingError } = await storeProductQueries.getByUrl(url)
    if (!existingError && existing && existing.name) {
      return NextResponse.json({
        message: "Product already exists",
        url,
        product: existing,
        origin: originInt,
      })
    }

    const scraper = getScraper(originInt)
    const result = await scraper.scrape({ url })

    // Handle 404 - product doesn't exist
    if (result.type === "not_found") {
      await storeProductQueries.markUnavailable({ url })
      return NextResponse.json(
        { error: "Product not found (404)", url, origin: originInt, available: false },
        { status: 404 },
      )
    }

    if (!result.product) {
      return NextResponse.json({ error: "Failed to scrape product", url, origin: originInt }, { status: 400 })
    }

    const { data: product, error: productError } = await storeProductQueries.createOrUpdateProduct(
      result.product as unknown as StoreProduct,
    )

    if (productError) {
      return NextResponse.json(
        {
          error: "Failed to add product",
          details: productError,
          scrapedProduct: result.product,
          origin: originInt,
          url,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      message: "Successfully added product",
      url,
      product,
      scrapedProduct: result.product,
      origin: originInt,
      available: true,
    })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
