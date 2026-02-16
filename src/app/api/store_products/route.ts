import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveUser } from "@/lib/supabase/tools"
import {
  queryStoreProducts,
  type StoreProductsQueryParams,
  type StoreProductWithMeta,
  type StoreProductsQueryResult,
  SupermarketChain,
} from "@/lib/queries/store-products"
import type { SearchType, SortByType } from "@/types/business"
import { PrioritySource } from "@/types"
import { isStoreProductsCacheEnabled, getCachedStoreProducts, setCachedStoreProducts } from "@/lib/kv"

/**
 * GET /api/store_products
 *
 * Fetches store products with filtering, sorting, and pagination.
 * Results are cached in Redis when ENABLE_STORE_PRODUCTS_CACHE is enabled.
 *
 * Query Parameters:
 * - q: Search query string
 * - searchType: "any" | "name" | "brand" | "url" | "category"
 * - origin: Comma-separated origin IDs (e.g., "1,2,3")
 * - priority: Comma-separated priorities (e.g., "1,2,3,none")
 * - source: Comma-separated priority source values (e.g., "ai,manual")
 * - category, category_2, category_3: Hierarchical category filter (store-specific)
 * - categories: Semicolon-separated main categories (e.g., "Laticínios;Bebidas")
 * - canonicalCat: Canonical category ID (includes all descendants)
 * - sort: "a-z" | "z-a" | "price-low-high" | "price-high-low" | "only-nulls"
 * - orderByPriority: "true" to order by priority first
 * - page: Page number (1-indexed)
 * - limit: Items per page
 * - onlyDiscounted: "true" to show only discounted products
 * - tracked: "true" to show only tracked products (priority 1-5)
 */
export async function GET(req: NextRequest) {
  const start = performance.now()
  const timings: Record<string, number> = {}
  let last = start
  const t = (label: string) => {
    const now = performance.now()
    timings[label] = Math.round(now - last)
    last = now
  }

  try {
    const params = req.nextUrl.searchParams

    const queryParams = parseSearchParams(params)
    t("parseParams")

    const supabase = createClient()
    t("createClient")

    const cacheKey = JSON.stringify(queryParams)
    const cacheEnabled = isStoreProductsCacheEnabled()

    // Start auth resolution in parallel with the main query
    const userPromise = resolveUser(supabase)

    let result: StoreProductsQueryResult

    if (cacheEnabled) {
      const cached = await getCachedStoreProducts<StoreProductsQueryResult>(cacheKey)
      t("cache.get")
      if (cached) {
        result = cached
      } else {
        result = await queryStoreProducts(queryParams, supabase)
        t("queryStoreProducts")
        if (!result.error) {
          setCachedStoreProducts(cacheKey, result).catch(() => {})
        }
        t("cache.set")
      }
    } else {
      result = await queryStoreProducts(queryParams, supabase)
      t("queryStoreProducts")
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    const user = await userPromise
    t("auth.getUser")

    let data = result.data
    if (user?.id && data.length > 0) {
      data = await augmentWithUserFavorites(supabase, data, user.id)
      t("augmentFavorites")
    }

    t("total")
    const headers: HeadersInit = {
      "Cache-Control": "private, max-age=0, stale-while-revalidate=120",
    }
    if (process.env.NODE_ENV === "development") {
      headers["X-Perf-Timings"] = JSON.stringify(timings)
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          pagedCount: result.pagination.totalCount,
          totalPages: result.pagination.totalPages,
          hasNextPage: result.pagination.hasNextPage,
          hasPreviousPage: result.pagination.hasPreviousPage,
        },
      },
      { status: 200, headers },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/store_products] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Augments product data with user's favorites.
 * Called after cache to add user-specific data.
 */
async function augmentWithUserFavorites(
  supabase: ReturnType<typeof createClient>,
  products: StoreProductWithMeta[],
  userId: string,
): Promise<StoreProductWithMeta[]> {
  const storeProductIds = products.map((sp) => sp.id).filter(Boolean)

  if (storeProductIds.length === 0) return products

  const { data: favorites } = await supabase
    .from("user_favorites")
    .select("store_product_id")
    .eq("user_id", userId)
    .in("store_product_id", storeProductIds)

  const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) ?? [])

  return products.map((sp) => ({
    ...sp,
    is_favorited: favoriteIds.has(sp.id),
  }))
}

/**
 * Parses URL search params into StoreProductsQueryParams
 */
function parseSearchParams(params: URLSearchParams): StoreProductsQueryParams {
  const queryParams: StoreProductsQueryParams = {}

  // Search
  const q = params.get("q")?.trim()
  const searchType = params.get("searchType") as SearchType | null
  if (q) {
    queryParams.search = {
      query: q,
      searchIn: searchType ?? "any",
    }
  }

  // Origin filter
  const originParam = params.get("origin")
  if (originParam) {
    const originIds = originParam
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v) && Object.values(SupermarketChain).includes(v)) as SupermarketChain[]

    if (originIds.length > 0) {
      queryParams.origin = {
        originIds: originIds.length === 1 ? originIds[0] : originIds,
      }
    }
  }

  // Priority filter
  const priorityParam = params.get("priority")
  if (priorityParam) {
    const priorityValues = priorityParam.split(",").map((v) => {
      const trimmed = v.trim()
      if (trimmed === "none") return null
      const num = parseInt(trimmed, 10)
      return !isNaN(num) && num >= 0 && num <= 5 ? num : null
    })

    // Filter out undefined (invalid) values but keep null
    const validValues = priorityValues.filter((v): v is number | null => v !== undefined)
    if (validValues.length > 0) {
      queryParams.priority = { values: validValues }
    }
  }

  // Source filter (priority_source)
  const sourceParam = params.get("source")
  if (sourceParam) {
    const sourceValues = sourceParam
      .split(",")
      .map((v) => v.trim())
      .filter((v): v is PrioritySource => v === "ai" || v === "manual")

    if (sourceValues.length > 0) {
      queryParams.source = { values: sourceValues }
    }
  }

  // Canonical category filter (unified categories across stores)
  const canonicalCatParam = params.get("canonicalCat")
  if (canonicalCatParam) {
    const categoryId = parseInt(canonicalCatParam, 10)
    if (!isNaN(categoryId) && categoryId > 0) {
      queryParams.canonicalCategory = { categoryId }
    }
  }

  // Category tuple filter (takes precedence)
  // Format: catTuples=cat1|cat2|cat3;cat1|cat2|cat3 (semicolon-separated tuples, pipe-separated values)
  const catTuplesParam = params.get("catTuples")
  if (catTuplesParam) {
    const tuples = catTuplesParam
      .split(";")
      .filter(Boolean)
      .map((tupleStr) => {
        const [category, category_2, category_3] = tupleStr.split("|")
        return {
          category: category || "",
          category_2: category_2 || "",
          category_3: category_3 || undefined,
        }
      })
      .filter((t) => t.category && t.category_2)

    if (tuples.length > 0) {
      queryParams.categories = { tuples }
    }
  } else {
    // Category filter (hierarchical - supports partial selection)
    const category1 = params.get("category")
    const category2 = params.get("category_2")
    const category3 = params.get("category_3")
    if (category1 || category2 || category3) {
      queryParams.categories = {
        hierarchy: {
          category1: category1 || undefined,
          category2: category2 || undefined,
          category3: category3 || undefined,
        },
      }
    } else {
      // Category filter (flat list)
      const categoriesParam = params.get("categories")
      if (categoriesParam) {
        const categories = categoriesParam.split(";").filter(Boolean)
        if (categories.length > 0) {
          queryParams.categories = { categories }
        }
      }
    }
  }

  // Sort options
  const sort = params.get("sort") as SortByType | null
  const orderByPriority = params.get("orderByPriority") === "true"
  if (sort || orderByPriority) {
    queryParams.sort = {
      sortBy: sort ?? "a-z",
      prioritizeByPriority: orderByPriority,
    }
  }

  // Pagination
  const page = parseInt(params.get("page") ?? "1", 10)
  const limit = parseInt(params.get("limit") ?? "36", 10)
  queryParams.pagination = {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 36 : Math.min(limit, 100), // Cap at 100
  }

  // Flags
  const onlyDiscounted = params.get("onlyDiscounted") === "true"
  const tracked = params.get("tracked") === "true"
  const onlyAvailableParam = params.get("onlyAvailable")
  const onlyAvailable = onlyAvailableParam === null ? true : onlyAvailableParam !== "false"

  queryParams.flags = {
    onlyDiscounted,
    onlyTracked: tracked,
    onlyAvailable,
  }

  return queryParams
}
