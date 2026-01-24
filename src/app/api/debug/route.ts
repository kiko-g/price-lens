import { NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/queries/products"

export async function GET() {
  const priority = 0
  const offset = 0
  const limit = 50
  const result = await storeProductQueries.getAllByPriority(priority, { offset, limit })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ data: result.data })
}
