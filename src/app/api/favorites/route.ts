import { NextRequest, NextResponse } from "next/server"
import { favoriteQueries, type FavoritesQueryParams, type FavoritesSortType } from "@/lib/db/queries/favorites"
import { userQueries } from "@/lib/db/queries/user"
import type { SearchType } from "@/types/extra"
import { SupermarketChain } from "@/types/extra"

export async function POST(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await favoriteQueries.addFavorite(user.id, store_product_id)

    if (error) {
      const status = error.code === "ALREADY_FAVORITED" ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in favorites POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { store_product_id } = await req.json()

    if (!store_product_id || typeof store_product_id !== "number") {
      return NextResponse.json({ error: "Invalid store_product_id" }, { status: 400 })
    }

    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const { error } = await favoriteQueries.removeFavorite(user.id, store_product_id)

    if (error) {
      console.error("Error removing favorite:", error)
      return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in favorites DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/favorites
 *
 * Fetches user's favorites with filtering, sorting, and pagination.
 *
 * Query Parameters:
 * - q: Search query string
 * - searchType: "any" | "name" | "brand" | "url" | "category"
 * - origin: Comma-separated origin IDs (e.g., "1,2,3")
 * - sort: "a-z" | "z-a" | "price-low-high" | "price-high-low" | "recently-added" | "oldest-first"
 * - page: Page number (1-indexed)
 * - limit: Items per page
 * - onlyDiscounted: "true" to show only discounted products
 */
export async function GET(req: NextRequest) {
  try {
    const { data: user, error: authError } = await userQueries.getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 })
    }

    const params = req.nextUrl.searchParams
    const queryParams = parseSearchParams(params)
    const result = await favoriteQueries.getUserFavoritesFiltered(user.id, queryParams)

    if (result.error) {
      console.error("Error fetching favorites:", result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in favorites GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Parses URL search params into FavoritesQueryParams
 */
function parseSearchParams(params: URLSearchParams): FavoritesQueryParams {
  const queryParams: FavoritesQueryParams = {}

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

  // Sort options
  const sort = params.get("sort") as FavoritesSortType | null
  if (sort) {
    queryParams.sort = { sortBy: sort }
  }

  // Pagination
  const page = parseInt(params.get("page") ?? "1", 10)
  const limit = parseInt(params.get("limit") ?? "24", 10)
  queryParams.pagination = {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 24 : Math.min(limit, 100),
  }

  // Flags
  const onlyDiscounted = params.get("onlyDiscounted") === "true"
  if (onlyDiscounted) {
    queryParams.flags = { onlyDiscounted }
  }

  return queryParams
}
