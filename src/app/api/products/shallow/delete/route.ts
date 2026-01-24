import { NextResponse } from "next/server"
import { productQueries } from "@/lib/queries/products"

export async function DELETE(request: Request) {
  const body = await request.json()
  const { id } = body
  const products = await productQueries.deleteProduct(id)
  return NextResponse.json(products)
}
