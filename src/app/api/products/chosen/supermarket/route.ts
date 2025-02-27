import { NextRequest, NextResponse } from "next/server"

import { productQueries } from "@/lib/db/queries/products"
import { Product } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { data: products, error: productsError } = await productQueries.getAll()

    if (productsError) {
      throw new Error(productsError.message)
    }

    const supermarketProducts = await Promise.all(
      products.map(async (product: Product) => {
        const { data: supermarketProduct } = await productQueries.getSupermarketProduct(product, null)
        return supermarketProduct
      }),
    )

    return NextResponse.json({ data: supermarketProducts || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
