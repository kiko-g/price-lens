import type { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = createClient()

  try {
    const params = req.nextUrl.searchParams
    const queryParam = params.get("q")
    const pageParam = params.get("page") ?? "1"
    const limitParam = params.get("limit") ?? "20"

    const page = parseInt(pageParam, 10) || 1
    const limit = parseInt(limitParam, 10) || 20
    const offset = (page - 1) * limit

    let query = supabase.from("products").select("*", { count: "exact" })
    if (queryParam) {
      const normalizedQuery = queryParam.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      query = query.ilike("name", `%${normalizedQuery}%`)
    }
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const pagedCount = count ?? 0
    const totalPages = Math.ceil(pagedCount / limit)

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          pagedCount,
          totalPages,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
