import { createClient } from "@/lib/supabase/server"
import { createClient as createClientBrowser } from "@/lib/supabase/client"
import type { PaginationParams, PaginatedQueryResult } from "./types"
import type { StoreProduct } from "@/types"
import type { SearchType, SortByType } from "@/types/extra"
import { SupermarketChain } from "@/types/extra"

// ============================================================================
// Favorites Query Types
// ============================================================================

export type FavoritesSortType = SortByType | "recently-added" | "oldest-first"

export interface FavoritesQueryParams {
  /** Text search filter */
  search?: {
    query: string
    searchIn: SearchType
  }
  /** Origin/store filter */
  origin?: {
    originIds: SupermarketChain | SupermarketChain[]
  }
  /** Sorting options */
  sort?: {
    sortBy: FavoritesSortType
  }
  /** Pagination */
  pagination?: {
    page: number
    limit: number
  }
  /** Flags */
  flags?: {
    onlyDiscounted?: boolean
  }
}

export interface FavoriteWithProduct {
  id: number
  created_at: string
  store_product_id: number
  store_products: StoreProduct & { is_favorited: true }
}

export interface FavoritesQueryResult {
  data: FavoriteWithProduct[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  error: { message: string; code?: string } | null
}

const DEFAULT_FAVORITES_PAGINATION = { page: 1, limit: 24 }

export const favoriteQueries = {
  async addFavorite(userId: string, storeProductId: number, isServer = true) {
    const supabase = isServer ? createClient() : createClientBrowser()

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

    const { data, error } = await supabase
      .from("user_favorites")
      .insert({ user_id: userId, store_product_id: storeProductId })
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
   * Get paginated favorites for a user
   */
  async getUserFavoritesPaginated(
    userId: string,
    pagination: PaginationParams = { page: 1, limit: 20 },
    isServer = true,
  ): Promise<PaginatedQueryResult<any>> {
    const supabase = isServer ? createClient() : createClientBrowser()
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("user_favorites")
      .select(
        `
        id,
        created_at,
        store_product_id,
        store_products (*)
      `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        error: { message: error.message, code: "DATABASE_ERROR" },
      }
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      error: null,
    }
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

  /**
   * Get filtered and paginated favorites for a user
   * Supports search, origin filtering, sorting, and pagination
   */
  async getUserFavoritesFiltered(
    userId: string,
    params: FavoritesQueryParams = {},
    isServer = true,
  ): Promise<FavoritesQueryResult> {
    const supabase = isServer ? createClient() : createClientBrowser()
    const pagination = { ...DEFAULT_FAVORITES_PAGINATION, ...params.pagination }
    const offset = (pagination.page - 1) * pagination.limit

    // Build base query with join to store_products
    let query = supabase
      .from("user_favorites")
      .select(
        `
        id,
        created_at,
        store_product_id,
        store_products!inner (*)
      `,
        { count: "exact" },
      )
      .eq("user_id", userId)

    // Apply origin filter on the joined store_products
    if (params.origin?.originIds) {
      const ids = params.origin.originIds
      if (Array.isArray(ids)) {
        if (ids.length === 1) {
          query = query.eq("store_products.origin_id", ids[0])
        } else if (ids.length > 1) {
          query = query.in("store_products.origin_id", ids)
        }
      } else {
        query = query.eq("store_products.origin_id", ids)
      }
    }

    // Apply discount filter
    if (params.flags?.onlyDiscounted) {
      query = query.gt("store_products.discount", 0)
    }

    // Apply search filter on store_products fields
    if (params.search?.query) {
      const searchQuery = params.search.query
      const searchIn = params.search.searchIn
      const sanitizedQuery = searchQuery.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()

      if (sanitizedQuery) {
        switch (searchIn) {
          case "url":
            query = query.ilike("store_products.url", `%${sanitizedQuery}%`)
            break
          case "any": {
            const pattern = `%${sanitizedQuery.replace(/ /g, "%")}%`
            query = query.or(
              `name.ilike.${pattern},brand.ilike.${pattern},url.ilike.${pattern},category.ilike.${pattern}`,
              { referencedTable: "store_products" },
            )
            break
          }
          case "name":
            query = query.ilike("store_products.name", `%${sanitizedQuery}%`)
            break
          case "brand":
            query = query.ilike("store_products.brand", `%${sanitizedQuery}%`)
            break
          case "category":
            query = query.ilike("store_products.category", `%${sanitizedQuery}%`)
            break
        }
      }
    }

    // Apply sorting
    const sortBy = params.sort?.sortBy ?? "recently-added"
    switch (sortBy) {
      case "recently-added":
        query = query.order("created_at", { ascending: false })
        break
      case "oldest-first":
        query = query.order("created_at", { ascending: true })
        break
      case "a-z":
        query = query.order("name", { ascending: true, referencedTable: "store_products" })
        break
      case "z-a":
        query = query.order("name", { ascending: false, referencedTable: "store_products" })
        break
      case "price-low-high":
        query = query.order("price", { ascending: true, referencedTable: "store_products" })
        break
      case "price-high-low":
        query = query.order("price", { ascending: false, referencedTable: "store_products" })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query

    if (error) {
      return {
        data: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        error: { message: error.message, code: "DATABASE_ERROR" },
      }
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pagination.limit)

    // Transform and augment data - mark all as favorited since this is favorites list
    const transformedData: FavoriteWithProduct[] = (data || []).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      store_product_id: item.store_product_id,
      store_products: {
        ...item.store_products,
        is_favorited: true,
      },
    }))

    return {
      data: transformedData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalCount,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      },
      error: null,
    }
  },
}
