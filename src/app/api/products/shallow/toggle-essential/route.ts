import { NextResponse } from "next/server"
import { productQueries } from "@/lib/db/queries/products"

export async function POST(request: Request) {
  const { id } = await request.json()
  const products = await productQueries.toggleEssential(id)
  return NextResponse.json(products)
}
