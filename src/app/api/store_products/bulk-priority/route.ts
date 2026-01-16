import { NextRequest, NextResponse } from "next/server"
import {
  getMatchingProductsCount,
  bulkUpdatePriority,
  type StoreProductsQueryParams,
  SupermarketChain,
} from "@/lib/db/queries/store-products"
import type { SearchType } from "@/types/business"
import { PrioritySource } from "@/types"

/**
 * GET /api/store_products/bulk-priority
 *
 * Get count of products matching the filter criteria (for preview)
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const params = req.nextUrl.searchParams
    const queryParams = parseSearchParams(params)

    const result = await getMatchingProductsCount(queryParams)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ count: result.count }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/store_products/bulk-priority GET] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/store_products/bulk-priority
 *
 * Bulk update priority for all products matching the filter criteria
 *
 * Body:
 * - priority: number (0-5) - The new priority to set
 *
 * Query params: Same as GET /api/store_products for filtering
 */
export async function PATCH(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const params = req.nextUrl.searchParams
    const body = await req.json()

    // Validate priority
    const priority = body.priority
    if (typeof priority !== "number" || priority < 0 || priority > 5) {
      return NextResponse.json({ error: "Priority must be a number between 0 and 5" }, { status: 400 })
    }

    const queryParams = parseSearchParams(params)

    const result = await bulkUpdatePriority({
      filters: queryParams,
      priority,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ updatedCount: result.updatedCount }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/store_products/bulk-priority PATCH] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Parses URL search params into StoreProductsQueryParams
 * (Reused from main store_products route)
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

  // Category tuple filter (takes precedence)
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
    // Category filter (hierarchical)
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
      const categoriesParam = params.get("categories")
      if (categoriesParam) {
        const categories = categoriesParam.split(";").filter(Boolean)
        if (categories.length > 0) {
          queryParams.categories = { categories }
        }
      }
    }
  }

  // Flags
  const onlyDiscounted = params.get("onlyDiscounted") === "true"
  const tracked = params.get("tracked") === "true"
  if (onlyDiscounted || tracked) {
    queryParams.flags = {
      onlyDiscounted,
      onlyTracked: tracked,
    }
  }

  return queryParams
}
