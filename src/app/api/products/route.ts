import { ProductQueryType } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") as ProductQueryType
    const q = searchParams.get("q") ?? ""
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const { data, error } = await productQueries.getAllLinked(
      type,
      offset ? parseInt(offset) : 0,
      limit ? parseInt(limit) : 36,
      q,
    )

    console.debug(data)

    if (error) {
      return NextResponse.json({ data: [], error: error }, { status: 200 })
    }

    let filteredData = data || []
    if (type === "essential") filteredData = filteredData.filter((product) => product.essential === true)
    else if (type === "non-essential") filteredData = filteredData.filter((product) => product.essential === false)

    return NextResponse.json(filteredData, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
