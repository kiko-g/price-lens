import { storeProductQueries } from "@/lib/queries/products"
import { getCachedCategories, setCachedCategories } from "@/lib/kv"
import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

const CACHE_TTL = 7 * 24 * 60 * 60 // 1 week

function createCacheKey(category1Array: string[], category2Array: string[], category3Array: string[]): string {
  const keyData = [
    category1Array.sort().join(","),
    category2Array.sort().join(","),
    category3Array.sort().join(","),
  ].join("|")

  if (keyData.length > 50) {
    const hash = createHash("sha256").update(keyData).digest("hex").substring(0, 16)
    return `categories:${hash}`
  }

  return `categories:${keyData}`
}

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

  const cacheKey = createCacheKey(category1Array, category2Array, category3Array)

  const cachedData = await getCachedCategories(cacheKey)
  if (cachedData) {
    return NextResponse.json(
      { data: cachedData, cached: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=604800",
        },
      },
    )
  }

  const { data, error } = await storeProductQueries.getAllCategories({
    category1List: category1Array,
    category2List: category2Array,
    category3List: category3Array,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await setCachedCategories(cacheKey, data, CACHE_TTL)

  return NextResponse.json(
    { data, cached: false },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=604800",
      },
    },
  )
}
