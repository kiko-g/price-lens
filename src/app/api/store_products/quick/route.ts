import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { queryStoreProductsQuick } from "@/lib/queries/store-products"
import { isStoreProductsCacheEnabled, getCachedStoreProducts, setCachedStoreProducts } from "@/lib/kv"

/**
 * GET /api/store_products/quick?q=...&limit=7
 *
 * Fast path for header/quick search. Name-only search, tracked + available,
 * no favorites. Results cached when Redis is enabled.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim()
    const limitParam = req.nextUrl.searchParams.get("limit")
    const limit = Math.min(Math.max(1, parseInt(limitParam ?? "7", 10) || 7), 20)

    if (!q || q.length < 2) {
      return NextResponse.json(
        { data: [], pagination: { page: 1, limit, totalCount: null, totalPages: null, hasNextPage: false, hasPreviousPage: false } },
        { status: 200, headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } },
      )
    }

    const cacheKey = `quick:${q}:${limit}`
    const cacheEnabled = isStoreProductsCacheEnabled()

    if (cacheEnabled) {
      const cached = await getCachedStoreProducts<{ data: unknown[]; pagination: unknown }>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          status: 200,
          headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
        })
      }
    }

    const supabase = createClient()
    const result = await queryStoreProductsQuick(q, limit, supabase)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    const payload = { data: result.data, pagination: result.pagination }
    if (cacheEnabled) {
      setCachedStoreProducts(cacheKey, payload).catch(() => {})
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[/api/store_products/quick] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
