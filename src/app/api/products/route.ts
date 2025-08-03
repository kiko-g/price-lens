import { NextRequest, NextResponse } from "next/server"

import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const q = searchParams.get("q") ?? ""
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")
    const origin = searchParams.get("origin")

    const { data, error } = await productQueries.getAllLinked({
      offset: offset ? parseInt(offset) : 0,
      limit: limit ? parseInt(limit) : 36,
      origin: origin ? parseInt(origin) : 0,
      q,
    })

    if (error) return NextResponse.json({ data: [], error: error }, { status: 200 })
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
