import { NextRequest, NextResponse } from "next/server"

import { productQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await productQueries.getAll()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
