import { createClient } from "@/lib/supabase/server"
import { createClient as createClientBrowser } from "@/lib/supabase/client"
import { fetchAll } from "@/lib/supabase/fetch-all"
import type { PaginationParams, PaginatedQueryResult } from "./types"
import type { StoreProduct } from "@/types"
import type { SearchType, SortByType } from "@/types/business"
import { SupermarketChain } from "@/types/business"

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
    priceChange?: "drop" | "increase"
  }
}

export interface FavoriteWithProduct {
  id: number
  created_at: string
  store_product_id: number
  store_products: StoreProduct & { is_favorited: true }
}

export interface FavoritesSummary {
  onSale: number
  priceDrops: number
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
  summary: FavoritesSummary | null
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

    const { data, error } = await fetchAll(() =>
      supabase
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
        .order("created_at", { ascending: false }),
    )

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
   *
   * PostgREST's `referencedTable` ordering only sorts embedded data, not
   * parent rows. To get correct ordering we flip the query direction:
   *   - Date sorts (recently-added, oldest-first): query FROM user_favorites
   *     so `created_at` is on the main table.
   *   - Product-column sorts (a-z, price, etc.): query FROM store_products
   *     so the sort column is on the main table.
   */
  async getUserFavoritesFiltered(
    userId: string,
    params: FavoritesQueryParams = {},
    isServer = true,
  ): Promise<FavoritesQueryResult> {
    const supabase = isServer ? createClient() : createClientBrowser()
    const pagination = { ...DEFAULT_FAVORITES_PAGINATION, ...params.pagination }
    const offset = (pagination.page - 1) * pagination.limit

    const sortBy = params.sort?.sortBy ?? "recently-added"
    const isFavColumnSort = sortBy === "recently-added" || sortBy === "oldest-first"

    // Global summary counts (unfiltered, head-only — cheap)
    const onSaleQuery = supabase
      .from("user_favorites")
      .select("id, store_products!inner(id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("store_products.discount", 0)

    const priceDropsQuery = supabase
      .from("user_favorites")
      .select("id, store_products!inner(id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .lt("store_products.price_change_pct", 0)

    const mainQuery = isFavColumnSort
      ? this._buildFavoritesFromFavorites(supabase, userId, params, sortBy, offset, pagination.limit)
      : this._buildFavoritesFromProducts(supabase, userId, params, sortBy, offset, pagination.limit)

    const [mainResult, onSaleResult, priceDropsResult] = await Promise.all([mainQuery, onSaleQuery, priceDropsQuery])

    const { data, error, count } = mainResult

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
        summary: null,
        error: { message: error.message, code: "DATABASE_ERROR" },
      }
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pagination.limit)

    const transformedData: FavoriteWithProduct[] = (data || []).map((item: any) => {
      if (isFavColumnSort) {
        return {
          id: item.id,
          created_at: item.created_at,
          store_product_id: item.store_product_id,
          store_products: { ...item.store_products, is_favorited: true },
        }
      }
      const fav = Array.isArray(item.user_favorites) ? item.user_favorites[0] : item.user_favorites
      const productFields = Object.fromEntries(Object.entries(item).filter(([k]) => k !== "user_favorites"))
      return {
        id: fav.id,
        created_at: fav.created_at,
        store_product_id: fav.store_product_id,
        store_products: { ...productFields, is_favorited: true },
      }
    })

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
      summary: {
        onSale: onSaleResult.count ?? 0,
        priceDrops: priceDropsResult.count ?? 0,
      },
      error: null,
    }
  },

  /**
   * Query from user_favorites — used when sorting by created_at (main table column).
   * Filters reference store_products via the join prefix.
   */
  _buildFavoritesFromFavorites(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    params: FavoritesQueryParams,
    sortBy: FavoritesSortType,
    offset: number,
    limit: number,
  ) {
    let query = supabase
      .from("user_favorites")
      .select("id, created_at, store_product_id, store_products!inner(*)", { count: "exact" })
      .eq("user_id", userId)

    query = this._applyFiltersFromFavorites(query, params)

    if (sortBy === "oldest-first") {
      query = query.order("created_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    return query.range(offset, offset + limit - 1)
  },

  /**
   * Query from store_products — used when sorting by a product column (main table).
   * Filters reference store_products columns directly (no prefix needed).
   */
  _buildFavoritesFromProducts(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    params: FavoritesQueryParams,
    sortBy: FavoritesSortType,
    offset: number,
    limit: number,
  ) {
    let query = supabase
      .from("store_products")
      .select("*, user_favorites!inner(id, created_at, store_product_id)", { count: "exact" })
      .eq("user_favorites.user_id", userId)

    query = this._applyFiltersFromProducts(query, params)

    switch (sortBy) {
      case "a-z":
        query = query.order("name", { ascending: true })
        break
      case "z-a":
        query = query.order("name", { ascending: false })
        break
      case "price-low-high":
        query = query.order("price", { ascending: true })
        break
      case "price-high-low":
        query = query.order("price", { ascending: false })
        break
      case "price-drop":
        query = query.order("price_change_pct", { ascending: true, nullsFirst: false })
        break
      case "price-increase":
        query = query.order("price_change_pct", { ascending: false, nullsFirst: false })
        break
      case "best-discount":
        query = query.order("discount", { ascending: false, nullsFirst: false })
        break
      default:
        query = query.order("name", { ascending: true })
    }

    return query.range(offset, offset + limit - 1)
  },

  /** Apply filters when querying FROM user_favorites (store_products columns need prefix). */
  _applyFiltersFromFavorites(query: any, params: FavoritesQueryParams) {
    if (params.origin?.originIds) {
      const ids = params.origin.originIds
      if (Array.isArray(ids)) {
        query =
          ids.length === 1 ? query.eq("store_products.origin_id", ids[0]) : query.in("store_products.origin_id", ids)
      } else {
        query = query.eq("store_products.origin_id", ids)
      }
    }

    if (params.flags?.onlyDiscounted) {
      query = query.gt("store_products.discount", 0)
    }
    if (params.flags?.priceChange === "drop") {
      query = query.lt("store_products.price_change_pct", 0)
    } else if (params.flags?.priceChange === "increase") {
      query = query.gt("store_products.price_change_pct", 0)
    }

    if (params.search?.query) {
      const sanitized = params.search.query.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()
      if (sanitized) {
        const searchIn = params.search.searchIn
        switch (searchIn) {
          case "url":
            query = query.ilike("store_products.url", `%${sanitized}%`)
            break
          case "any": {
            const p = `%${sanitized.replace(/ /g, "%")}%`
            query = query.or(`name.ilike.${p},brand.ilike.${p},url.ilike.${p},category.ilike.${p}`, {
              referencedTable: "store_products",
            })
            break
          }
          case "name":
            query = query.ilike("store_products.name", `%${sanitized}%`)
            break
          case "brand":
            query = query.ilike("store_products.brand", `%${sanitized}%`)
            break
          case "category":
            query = query.ilike("store_products.category", `%${sanitized}%`)
            break
        }
      }
    }

    return query
  },

  /** Apply filters when querying FROM store_products (columns are on main table, no prefix). */
  _applyFiltersFromProducts(query: any, params: FavoritesQueryParams) {
    if (params.origin?.originIds) {
      const ids = params.origin.originIds
      if (Array.isArray(ids)) {
        query = ids.length === 1 ? query.eq("origin_id", ids[0]) : query.in("origin_id", ids)
      } else {
        query = query.eq("origin_id", ids)
      }
    }

    if (params.flags?.onlyDiscounted) {
      query = query.gt("discount", 0)
    }
    if (params.flags?.priceChange === "drop") {
      query = query.lt("price_change_pct", 0)
    } else if (params.flags?.priceChange === "increase") {
      query = query.gt("price_change_pct", 0)
    }

    if (params.search?.query) {
      const sanitized = params.search.query.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()
      if (sanitized) {
        const searchIn = params.search.searchIn
        switch (searchIn) {
          case "url":
            query = query.ilike("url", `%${sanitized}%`)
            break
          case "any": {
            const p = `%${sanitized.replace(/ /g, "%")}%`
            query = query.or(`name.ilike.${p},brand.ilike.${p},url.ilike.${p},category.ilike.${p}`)
            break
          }
          case "name":
            query = query.ilike("name", `%${sanitized}%`)
            break
          case "brand":
            query = query.ilike("brand", `%${sanitized}%`)
            break
          case "category":
            query = query.ilike("category", `%${sanitized}%`)
            break
        }
      }
    }

    return query
  },
}
