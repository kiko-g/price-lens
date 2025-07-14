import { NextResponse } from "next/server"
import { productQueries, storeProductQueries } from "@/lib/db/queries/products"

export const maxDuration = 60

export async function GET() {
  try {
    const { data, error } = await storeProductQueries.getUnsyncedHighPriority()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data.length > 0) {
      const { data: products, error: productsError } = await productQueries.insertProductsFromStoreProducts(data)
      if (productsError) {
        return NextResponse.json({ error: productsError.message }, { status: 500 })
      }
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error }, { status: 500 })
  }
}
