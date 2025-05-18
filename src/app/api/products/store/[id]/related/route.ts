import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await storeProductQueries.getRelatedStoreProducts(id)

  if (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }

  return NextResponse.json(data)
}
