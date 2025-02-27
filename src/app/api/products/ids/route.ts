import { NextRequest, NextResponse } from "next/server"

import { supermarketProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const idsParam = params.get("ids")

    if (!idsParam) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const ids = idsParam.split(",")
    const { data, error } = await supermarketProductQueries.getByIds(ids)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
