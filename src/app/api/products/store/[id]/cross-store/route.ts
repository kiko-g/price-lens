import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "10")

  const { data, error } = await storeProductQueries.getSameProductDifferentStores(id, limit)

  if (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }

  return NextResponse.json(data)
}
