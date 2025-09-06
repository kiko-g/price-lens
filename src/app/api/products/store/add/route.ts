import { NextRequest, NextResponse } from "next/server"
import { getScraper } from "@/lib/scraper"
import { storeProductQueries } from "@/lib/db/queries/products"
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
    const scrapedProduct = (await scraper.productPage(url)) as StoreProduct
    const { data: product, error: productError } = await storeProductQueries.createOrUpdateProduct(scrapedProduct)

    if (productError) {
      return NextResponse.json(
        { error: "Failed to add product", details: productError, scrapedProduct, origin: originInt, url },
        { status: 400 },
      )
    }

    return NextResponse.json({
      message: "Successfully added product",
      url,
      product,
      scrapedProduct,
      origin: originInt,
    })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
