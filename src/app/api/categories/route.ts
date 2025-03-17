import { storeProductQueries } from "@/lib/db/queries/products"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { data, error } = await storeProductQueries.getAllCategories()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}
