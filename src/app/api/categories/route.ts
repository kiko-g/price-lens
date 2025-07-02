import { storeProductQueries } from "@/lib/db/queries/products"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const category1Param = params.get("category_1") ?? ""
  const category2Param = params.get("category_2") ?? ""
  const category3Param = params.get("category_3") ?? ""
  const category1Array = category1Param ? category1Param.split(",") : []
  const category2Array = category2Param ? category2Param.split(",") : []
  const category3Array = category3Param ? category3Param.split(",") : []

  if (category3Array.length > 0 && (category1Array.length === 0 || category2Array.length === 0)) {
    return NextResponse.json(
      { error: "category_1 and category_2 are required when category_3 is specified" },
      { status: 400 },
    )
  }

  if (category2Array.length > 0 && category1Array.length === 0) {
    return NextResponse.json({ error: "category_1 is required when category_2 is specified" }, { status: 400 })
  }

  const { data, error } = await storeProductQueries.getAllCategories({
    category1List: category1Array,
    category2List: category2Array,
    category3List: category3Array,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}
