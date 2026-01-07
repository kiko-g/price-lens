import { NextRequest, NextResponse } from "next/server"
import { findRelatedProducts } from "@/lib/db/queries/product-matching"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "10")

  const { data, error } = await findRelatedProducts(id, limit)

  if (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }

  return NextResponse.json(data)
}
