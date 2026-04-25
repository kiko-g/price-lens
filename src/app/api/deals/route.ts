import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveUser } from "@/lib/supabase/tools"
import { DEFAULT_DEALS_PAGE_LIMIT, MAX_DEALS_PAGE_LIMIT } from "@/lib/queries/deals-constants"
import { queryDealsFeed } from "@/lib/queries/deals-feed"
import type { StoreProductWithMeta } from "@/lib/queries/store-products/types"
import { SupermarketChain } from "@/types/business"

const VALID_DEAL_ORIGINS = [SupermarketChain.Continente, SupermarketChain.Auchan, SupermarketChain.PingoDoce] as const

/**
 * GET /api/deals
 *
 * Query params:
 * - page: 1-based (default 1)
 * - limit: page size (default 20, max 100)
 * - origin: single store origin id (e.g. Continente=1); invalid values ignored
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const pageRaw = parseInt(params.get("page") ?? "1", 10)
    const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw

    const limitRaw = parseInt(params.get("limit") ?? String(DEFAULT_DEALS_PAGE_LIMIT), 10)
    const limit = isNaN(limitRaw) || limitRaw < 1 ? DEFAULT_DEALS_PAGE_LIMIT : Math.min(limitRaw, MAX_DEALS_PAGE_LIMIT)

    let originId: number | undefined
    const originParam = params.get("origin")?.trim()
    if (originParam) {
      const n = parseInt(originParam.split(",")[0] ?? "", 10)
      if (!isNaN(n) && VALID_DEAL_ORIGINS.includes(n as (typeof VALID_DEAL_ORIGINS)[number])) {
        originId = n
      }
    }

    const supabase = createClient()
    const userPromise = resolveUser(supabase)

    const result = await queryDealsFeed({ page, limit, originId }, supabase)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    const user = await userPromise
    let data = result.data
    if (user?.id && data.length > 0) {
      data = await augmentWithUserFavorites(supabase, data, user.id)
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
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=0, stale-while-revalidate=120",
        },
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/deals] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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
