import { NextRequest, NextResponse } from "next/server"
import { findRelatedProducts } from "@/lib/queries/product-matching"
import { createClient } from "@/lib/supabase/server"
import {
  isStoreProductsCacheEnabled,
  getCachedRelatedProducts,
  setCachedRelatedProducts,
} from "@/lib/kv"
import type { StoreProduct } from "@/types"

type RelatedProduct = StoreProduct & {
  similarity_score: number
  similarity_factors: string[]
  is_favorited: boolean
}

/**
 * GET /api/store_products/[id]/related
 *
 * Fetches related products (same brand, similar type) with Redis caching.
 * This was previously one of the slowest routes due to heavy JS scoring
 * on 200 candidates with no caching.
 *
 * Query Parameters:
 * - limit: Number of results to return (default: 10)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") || "10")

  // Get current user for favorites augmentation
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cacheEnabled = isStoreProductsCacheEnabled()

  // Try cache first (without user-specific favorites)
  if (cacheEnabled) {
    const cached = await getCachedRelatedProducts<RelatedProduct[]>(id, limit)
    if (cached) {
      // Augment with user favorites if logged in
      if (user?.id) {
        const augmented = await augmentWithFavorites(supabase, cached, user.id)
        return NextResponse.json(augmented)
      }
      return NextResponse.json(cached)
    }
  }

  // Cache miss - compute related products
  const { data, error } = await findRelatedProducts(id, limit, user?.id || null)

  if (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }

  // Cache the result (without user-specific favorites)
  if (cacheEnabled && data) {
    const dataWithoutFavorites = data.map((p) => ({ ...p, is_favorited: false }))
    await setCachedRelatedProducts(id, limit, dataWithoutFavorites)
  }

  return NextResponse.json(data)
}

/**
 * Augments products with user's favorite status.
 */
async function augmentWithFavorites(
  supabase: ReturnType<typeof createClient>,
  products: RelatedProduct[],
  userId: string,
): Promise<RelatedProduct[]> {
  if (products.length === 0) return products

  const productIds = products.map((p) => p.id).filter(Boolean)

  const { data: favorites } = await supabase
    .from("user_favorites")
    .select("store_product_id")
    .eq("user_id", userId)
    .in("store_product_id", productIds)

  const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) ?? [])

  return products.map((p) => ({
    ...p,
    is_favorited: favoriteIds.has(p.id),
  }))
}
