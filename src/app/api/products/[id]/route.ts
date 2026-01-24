import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/queries/products"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await storeProductQueries.getById(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
