import { NextRequest, NextResponse } from "next/server"

import { productQueries, storeProductQueries } from "@/lib/db/queries/products"
import { StoreProduct } from "@/types"

export async function POST(req: NextRequest) {
  const { product } = await req.json()
  const storeProduct = product as StoreProduct

  if (storeProduct.is_tracked) {
    return NextResponse.json({ message: "Product already in tracking list" }, { status: 400 })
  }

  await storeProductQueries.setIsTracked(product.id, true)

  const productResponse = await productQueries.createProductLinkedProduct(product)

  if (productResponse.error) {
    return NextResponse.json({ message: "Error creating product", error: productResponse.error }, { status: 500 })
  }

  return NextResponse.json({ message: "Product added to tracking list", data: productResponse.data }, { status: 200 })
}
