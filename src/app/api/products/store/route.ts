import { NextRequest, NextResponse } from "next/server"
import { type SearchType, type SortByType } from "@/types/business"

import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/business/pricing"
import { storeProductQueries } from "@/lib/queries/products"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const queryParam = params.get("q") || params.get("query") || ""
    const pageParam = params.get("page") ?? "1"
    const limitParam = params.get("limit") ?? "20"
    const searchTypeParam = params.get("searchType") ?? "any"
    const sortParam = params.get("sort") ?? "a-z"
    const categoriesParam = params.get("categories") ?? ""
    const categoryParam = params.get("category") ?? ""
    const category2Param = params.get("category_2") ?? ""
    const category3Param = params.get("category_3") ?? ""
    const onlyDiscountedParam = params.get("onlyDiscounted") ?? "false"
    const orderByPriorityParam = params.get("orderByPriority") ?? "false"
    const originParam = params.get("origin") ?? null
    const trackedParam = params.get("tracked") ?? null
    const priorityParam = params.get("priority") ?? undefined

    const query = queryParam
    const page = parseInt(pageParam, 10) || 1
    const limit = parseInt(limitParam, 10) || 20
    const searchType = searchTypeParam as SearchType
    const sort = sortParam as SortByType
    const categories = categoriesParam ? categoriesParam.split(";") : []
    const category = categoryParam || null
    const category2 = category2Param || null
    const category3 = category3Param || null
    // Origin can be comma-separated for multi-select: "1,2,3"
    const origin = originParam || undefined
    const onlyDiscounted = onlyDiscountedParam === "true"
    const orderByPriority = orderByPriorityParam === "true"
    const tracked = trackedParam ? true : false

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error, count } = await storeProductQueries.getAll({
      page,
      limit,
      query,
      searchType,
      sort,
      categories,
      category,
      category2,
      category3,
      origin,
      userId: user?.id || null,
      tracked,
      orderByPriority,
      priority: priorityParam,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const storeProduct = body.storeProduct

    if (!storeProduct || !storeProduct.url) {
      return NextResponse.json({ error: "Bad request", details: "Missing storeProduct or url" }, { status: 400 })
    }

    // Scrape and update the product
    const response = await scrapeAndReplaceProduct(storeProduct.url, storeProduct.origin_id, storeProduct)
    const json = await response.json()

    // If scrape failed, return the error response
    if (response.status !== 200) {
      return NextResponse.json(json, { status: response.status })
    }

    // Update price point if we have a product ID
    const productId = storeProduct.id

    if (productId && json.data) {
      // Update price point - same as automated scrapers do
      await updatePricePoint({
        ...json.data,
        id: productId,
      })
    }

    return NextResponse.json(json, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
