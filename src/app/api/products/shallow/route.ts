import { NextResponse } from "next/server"
import { productQueries } from "@/lib/db/queries/products"

export async function GET() {
  const products = await productQueries.getAll()
  return NextResponse.json(products)
}
