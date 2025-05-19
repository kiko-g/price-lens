import { NextRequest, NextResponse } from "next/server"

import { type SearchType, type SortByType } from "@/types/extra"
import { storeProductQueries } from "@/lib/db/queries/products"

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const queryParam = params.get("q") ?? ""
    const pageParam = params.get("page") ?? "1"
    const limitParam = params.get("limit") ?? "20"
    const searchTypeParam = params.get("searchType") ?? "name"
    const sortParam = params.get("sort") ?? "a-z"
    const categoriesParam = params.get("categories") ?? ""
    const onlyDiscountedParam = params.get("onlyDiscounted") ?? "false"

    const query = queryParam
    const page = parseInt(pageParam, 10) || 1
    const limit = parseInt(limitParam, 10) || 20
    const searchType = searchTypeParam as SearchType
    const sort = sortParam as SortByType
    const categories = categoriesParam ? categoriesParam.split(";") : []
    const onlyDiscounted = onlyDiscountedParam === "true"

    const { data, error, count } = await storeProductQueries.getAll({
      page,
      limit,
      query,
      searchType,
      sort,
      categories,
      options: {
        onlyDiscounted,
      },
    })

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
