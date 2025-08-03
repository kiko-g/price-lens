import { createClient } from "@/lib/supabase/server"
import { createClient as createClientBrowser } from "@/lib/supabase/client"
import type { UserFavorite } from "@/types"

export const favoriteQueries = {
  /**
   * Add a product to user's favorites
   */
  async addFavorite(userId: string, storeProductId: number, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

    // Check if already favorited
    const { data: existing } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("store_product_id", storeProductId)
      .single()

    if (existing) {
      return {
        data: null,
        error: { message: "Product already favorited", code: "ALREADY_FAVORITED" },
      }
    }

    // Add to favorites
    const { data, error } = await supabase
      .from("user_favorites")
      .insert({
        user_id: userId,
        store_product_id: storeProductId,
      })
      .select()
      .single()

    return { data, error }
  },

  /**
   * Remove a product from user's favorites
   */
  async removeFavorite(userId: string, storeProductId: number, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("store_product_id", storeProductId)

    return { error }
  },

  /**
   * Check if a product is favorited by user
   */
  async isFavorited(userId: string, storeProductId: number, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("store_product_id", storeProductId)
      .single()

    if (error && error.code !== "PGRST116") {
      // Not found error
      return { data: false, error }
    }

    return { data: !!data, error: null }
  },

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userId: string, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

    const { data, error } = await supabase
      .from("user_favorites")
      .select(
        `
        id,
        created_at,
        store_product_id,
        store_products (*)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    return { data, error }
  },

  /**
   * Get favorites count for a user
   */
  async getFavoritesCount(userId: string, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

    const { count, error } = await supabase
      .from("user_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    return { count: count || 0, error }
  },

  /**
   * Toggle favorite status for a product
   */
  async toggleFavorite(userId: string, storeProductId: number, isServer = true) {
    const { data: isFav, error: checkError } = await this.isFavorited(userId, storeProductId, isServer)

    if (checkError) {
      return { data: null, error: checkError }
    }

    if (isFav) {
      const { error } = await this.removeFavorite(userId, storeProductId, isServer)
      return { data: { action: "removed", is_favorited: false }, error }
    } else {
      const { data, error } = await this.addFavorite(userId, storeProductId, isServer)
      return {
        data: data ? { action: "added", is_favorited: true, favorite: data } : null,
        error,
      }
    }
  },
}
