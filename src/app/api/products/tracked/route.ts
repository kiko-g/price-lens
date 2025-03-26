import { ProductQueryType } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") as ProductQueryType

    const { data, error } = await productQueries.getAllLinked(type)

    if (error) {
      return NextResponse.json({ data: data || [], error: error }, { status: 200 })
    }

    let filteredData = data || []
    if (type === "essential") {
      filteredData = filteredData.filter((product) => product.essential === true)
    } else if (type === "non-essential") {
      filteredData = filteredData.filter((product) => product.essential === false)
    }

    return NextResponse.json({ data: filteredData }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
