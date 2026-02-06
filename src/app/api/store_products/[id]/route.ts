import { NextRequest, NextResponse } from "next/server"
import { storeProductQueries } from "@/lib/queries/products"
import { createClient } from "@/lib/supabase/server"
import {
  isStoreProductsCacheEnabled,
  getCachedSingleProduct,
  setCachedSingleProduct,
} from "@/lib/kv"

/**
 * GET /api/store_products/[id]
 *
 * Fetches a single store product by ID with Redis caching.
 * User favorites are fetched separately (not cached).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Get current user for favorites augmentation
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cacheEnabled = isStoreProductsCacheEnabled()

  // Try cache first (without user-specific data)
  if (cacheEnabled) {
    const cached = await getCachedSingleProduct<{ data: unknown }>(id)
    if (cached) {
      // Augment with user favorites if logged in
      if (user?.id) {
        const augmented = await augmentWithFavorites(supabase, cached.data, user.id)
        return NextResponse.json(augmented)
      }
      return NextResponse.json(cached.data)
    }
  }

  // Cache miss - fetch from database
  const { data, error } = await storeProductQueries.getById(id, user?.id || null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Cache the result (without user-specific favorites)
  if (cacheEnabled && data) {
    // Store without favorites for caching
    const dataWithoutFavorites = { ...data, is_favorited: undefined }
    await setCachedSingleProduct(id, { data: dataWithoutFavorites })
  }

  return NextResponse.json(data)
}

/**
 * Augments a single product with user's favorite status.
 */
async function augmentWithFavorites(
  supabase: ReturnType<typeof createClient>,
  product: unknown,
  userId: string,
): Promise<unknown> {
  if (!product || typeof product !== "object") return product

  const productObj = product as { id?: number }
  if (!productObj.id) return product

  const { data: favorite } = await supabase
    .from("user_favorites")
    .select("store_product_id")
    .eq("user_id", userId)
    .eq("store_product_id", productObj.id)
    .single()

  return {
    ...productObj,
    is_favorited: !!favorite,
  }
}
