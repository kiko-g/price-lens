import type { GetAllQuery } from "@/types/extra"
import { createClient } from "@/lib/supabase/server"
import type { Product, ProductWithListings, StoreProduct } from "@/types"
import { PostgrestError } from "@supabase/supabase-js"
import { now } from "@/lib/utils"

export const productQueries = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
      return null
    }

    return { data, error }
  },

  async getAllLinked({
    offset = 0,
    limit = 10,
    q = "",
    origin = 0,
  }: {
    offset?: number
    limit?: number
    q?: string
    origin?: number
  }): Promise<{
    data: (Product & { store_products: StoreProduct[] })[]
    error: PostgrestError | null
    pagination: { total: number; offset: number; limit: number } | null
  }> {
    const supabase = createClient()

    let query = supabase
      .from("products")
      .select(`*, store_products ( * )`, { count: "exact" })
      .order("name", { ascending: true })

    if (origin !== 0) query = query.eq("store_products.origin_id", origin)

    query = query.range(offset, offset + limit - 1)

    if (q.trim().length >= 3) {
      const sanitized = q.replace(/[^\p{L}\p{N}\s]/gu, "").trim()
      query = query.ilike("name", `%${sanitized}%`)
    }

    const { data, error, count } = await query

    return {
      data: data ?? [],
      error,
      pagination: error ? null : { total: count ?? 0, offset, limit },
    }
  },

  async deleteProduct(id: number) {
    const supabase = createClient()

    const selectRes = await supabase.from("products").select("*").eq("id", id).single()
    if (selectRes.error) {
      console.error("Error fetching product:", selectRes.error)
      return {
        data: null,
        error: selectRes.error,
      }
    }

    const deleteProdRes = await supabase.from("products").delete().eq("id", id)
    if (deleteProdRes.error) {
      console.error("Error deleting product:", deleteProdRes.error)
      return {
        data: null,
        error: deleteProdRes.error,
      }
    }

    return {
      data: null,
      error: null,
    }
  },

  async getStoreProduct(product: ProductWithListings, storeProductId?: number) {
    const supabase = createClient()

    if (product.store_products) {
      const pick = product.store_products.find((sp) => sp.id === storeProductId) ?? product.store_products[0]
      return { data: pick, error: null }
    }

    const query = supabase.from("store_products").select("*").eq("product_id", product.id)

    if (storeProductId != null) {
      query.eq("id", storeProductId)
    }

    const { data, error } = await (storeProductId != null ? query.single() : query)

    if (error) return { data: null, error }

    if (Array.isArray(data)) {
      return { data: data[0] ?? null, error: data.length ? null : "No rows" }
    } else {
      return { data, error: error as string | null }
    }
  },

  async insertProductFromStoreProduct(sp: StoreProduct) {
    const supabase = createClient()

    const { data: newProduct, error: productError }: { data: Product | null; error: any } = await supabase
      .from("products")
      .insert({
        name: sp.name,
        brand: sp.brand,
        category: sp.category, // already nullable in your type
        is_generic: false, // exact-match bucket
      })
      .single()

    if (productError || !newProduct) {
      return { product: null, error: productError ?? "Failed to insert product" }
    }

    // 2) Link this store_product to its new product
    const { error: linkError } = await supabase
      .from("store_products")
      .update({ product_id: newProduct.id })
      .eq("id", sp.id)

    if (linkError) {
      return { product: newProduct, error: linkError }
    }

    return { product: newProduct, error: null }
  },

  insertProductsFromStoreProducts(sps: StoreProduct[]) {
    const supabase = createClient()
    const productsData = sps.map((sp) => ({
      name: sp.name,
      brand: sp.brand,
      category: sp.category,
      product_ref_ids: [sp.id?.toString() ?? ""],
    }))
    return supabase.from("products").insert(productsData)
  },
}

export const storeProductQueries = {
  async getByUrl(url: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from("store_products").select("*").eq("url", url).maybeSingle()
    return { data, error }
  },

  async getAll({
    page = 1,
    limit = 36,
    query = "",
    searchType = "any",
    nonNulls = true,
    sort = "a-z",
    tracked = false,
    categories = [],
    category = null,
    category2 = null,
    category3 = null,
    originId = null,
    userId = null,
    orderByPriority = false,
    options = {
      onlyDiscounted: false,
    },
  }: GetAllQuery) {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let dbQuery = supabase.from("store_products").select("*", { count: "exact" })
    if (tracked) dbQuery = dbQuery.in("priority", [3, 4, 5])

    if (sort && sort === "only-nulls") {
      dbQuery = dbQuery.is("name", null)
      dbQuery = dbQuery.order("url", { ascending: true })
      const result = await dbQuery.range(offset, offset + limit - 1)

      // Even for null products, we can show favorite status
      if (userId && result.data) {
        const storeProductIds = result.data.map((sp) => sp.id).filter(Boolean)

        if (storeProductIds.length > 0) {
          const { data: favorites } = await supabase
            .from("user_favorites")
            .select("store_product_id")
            .eq("user_id", userId)
            .in("store_product_id", storeProductIds)

          const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) || [])

          result.data = result.data.map((sp) => ({
            ...sp,
            is_favorited: favoriteIds.has(sp.id),
          }))
        }
      }

      return result
    }

    if (originId !== null && originId !== 0) dbQuery = dbQuery.eq("origin_id", originId)

    if (nonNulls) dbQuery = dbQuery.not("name", "eq", "").not("name", "is", null)

    if (query) {
      const sanitizedQuery = query.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()
      if (searchType === "url") dbQuery = dbQuery.ilike(searchType, `%${sanitizedQuery}%`)
      else if (searchType === "any") {
        // joint search within brand, url, name and category
        const pattern = `%${sanitizedQuery}%` // wrap in wildcards once
        const queries = [
          `brand.ilike.${pattern.replace(/ /g, "%")}`,
          `url.ilike.${pattern.replace(/ /g, "%")}`,
          `name.ilike.${pattern.replace(/ /g, "%")}`,
          `category.ilike.${pattern.replace(/ /g, "%")}`,
        ]
        dbQuery = dbQuery.or(queries.join(","))
      } else {
        // The issue is that textSearch requires a specific format for multi-word queries
        // For PostgreSQL's ts_query, words need to be connected with operators like & (AND) or | (OR)
        // Simply passing a space-separated string doesn't work correctly
        const formattedQuery = sanitizedQuery.split(/\s+/).filter(Boolean).join(" & ")
        if (formattedQuery) dbQuery = dbQuery.textSearch(searchType, formattedQuery)
      }
    }

    // Handle individual category parameters (takes precedence over categories array)
    if (category && category2 && category3) {
      dbQuery = dbQuery.eq("category", category).eq("category_2", category2).eq("category_3", category3)
    } else if (categories && categories.length !== 0) {
      dbQuery = dbQuery.in("category", categories) // FIXME: using main category, consider more
    }

    if (options.onlyDiscounted) dbQuery = dbQuery.gt("discount", 0)

    if (orderByPriority) dbQuery = dbQuery.order("priority", { ascending: false })

    if (sort) {
      switch (sort) {
        case "a-z":
          dbQuery = dbQuery.order("name", { ascending: true })
          break
        case "z-a":
          dbQuery = dbQuery.order("name", { ascending: false })
          break
        case "price-low-high":
          dbQuery = dbQuery.order("price", { ascending: true })
          break
        case "price-high-low":
          dbQuery = dbQuery.order("price", { ascending: false })
          break
      }
    }

    const result = await dbQuery.range(offset, offset + limit - 1)

    // If user is provided, augment with favorite status
    if (userId && result.data) {
      const storeProductIds = result.data.map((sp) => sp.id).filter(Boolean)

      if (storeProductIds.length > 0) {
        const { data: favorites } = await supabase
          .from("user_favorites")
          .select("store_product_id")
          .eq("user_id", userId)
          .in("store_product_id", storeProductIds)

        const favoriteIds = new Set(favorites?.map((f) => f.store_product_id) || [])

        result.data = result.data.map((sp) => ({
          ...sp,
          is_favorited: favoriteIds.has(sp.id),
        }))
      }
    }

    return result
  },

  async getAllNulls({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const supabase = createClient()
    const offset = (page - 1) * limit
    return supabase
      .from("store_products")
      .select("*", { count: "exact" })
      .is("name", null)
      .range(offset, offset + limit - 1)
  },

  async getInvalid() {
    const supabase = createClient()
    return supabase
      .from("store_products")
      .select("*")
      .not("url", "is", null)
      .not("created_at", "is", null)
      .is("name", null)
  },

  async getUncharted() {
    const supabase = createClient()
    return supabase.from("store_products").select("*").is("created_at", null)
  },

  async getById(id: string, userId?: string | null) {
    const supabase = createClient()
    const { data, error } = await supabase.from("store_products").select("*").eq("id", id).single()

    // If user is provided and product exists, check if it's favorited
    if (userId && data && !error) {
      const { data: favorite } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("store_product_id", data.id)
        .single()

      return {
        data: {
          ...data,
          is_favorited: !!favorite,
        },
        error,
      }
    }

    return { data, error }
  },

  async getByIds(ids: string[]) {
    const supabase = createClient()
    return supabase.from("store_products").select("*").in("id", ids)
  },

  async getByUrlSubstrs(substrs: string[]) {
    const supabase = createClient()
    return supabase
      .from("store_products")
      .select("*")
      .ilike("url", `%${substrs.join("%")}%`)
  },

  async upsert(sp: StoreProduct) {
    const supabase = createClient()
    return supabase.from("store_products").upsert(sp, {
      onConflict: "url",
      ignoreDuplicates: false,
    })
  },

  async upsertBlank({ url }: { url: string }) {
    const supabase = createClient()
    return supabase.from("store_products").upsert(
      {
        url,
        created_at: now(),
        updated_at: now(),
      },
      {
        onConflict: "url",
        ignoreDuplicates: false,
      },
    )
  },

  async updatePriority(id: number, priority: number | null) {
    const supabase = createClient()

    if (priority !== null && (priority < 0 || priority > 5 || !Number.isInteger(priority))) {
      return {
        data: null,
        error: {
          message: "Priority must be null or an integer between 0 and 5",
          status: 400,
        },
      }
    }

    const { data, error } = await supabase.from("store_products").update({ priority }).eq("id", id).select().single()

    if (error) {
      console.error("Error updating priority:", error)
      return {
        data: null,
        error: error,
      }
    }

    return {
      data: data,
      error: null,
    }
  },

  async createOrUpdateProduct(sp: StoreProduct) {
    const supabase = createClient()
    const { data: existingProduct } = await supabase
      .from("store_products")
      .select("created_at")
      .eq("url", sp.url)
      .single()

    const productToUpsert = {
      ...sp,
      priority: sp.priority || 1,
      created_at: sp.created_at || existingProduct?.created_at || sp.updated_at,
    }

    const { data, error } = await supabase.from("store_products").upsert(productToUpsert, {
      onConflict: "url",
      ignoreDuplicates: false,
    })

    // Clear categories cache when products are updated as they might introduce new categories
    if (!error) {
      try {
        const { clearCategoriesCache } = await import("@/lib/kv")
        await clearCategoriesCache()
      } catch (cacheError) {
        console.error("Failed to clear categories cache:", cacheError)
        // Don't fail the product operation if cache clearing fails
      }
    }

    return { data, error }
  },

  async getAllCategories({
    category1List = [],
    category2List = [],
    category3List = [],
  }: {
    category1List?: string[]
    category2List?: string[]
    category3List?: string[]
  }) {
    if (category3List.length > 0 && (category1List.length === 0 || category2List.length === 0)) {
      return {
        data: null,
        error: {
          message: "category_1 and category_2 are required when category_3 is specified",
          status: 400,
        },
      }
    }

    if (category2List.length > 0 && category1List.length === 0) {
      return {
        data: null,
        error: {
          message: "category_1 is required when category_2 is specified",
          status: 400,
        },
      }
    }

    const supabase = createClient()
    const PAGE_SIZE = 1000 // supabase limit
    let allCategories: { category: string; category_2: string; category_3: string }[] = []
    let page = 0
    let hasMore = true

    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from("store_products")
        .select("category, category_2, category_3")
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (pageError) {
        return {
          data: null,
          error: pageError,
        }
      }

      if (pageData && pageData.length > 0) {
        allCategories = [...allCategories, ...pageData]
        page++
      } else {
        hasMore = false
      }
    }

    const categories = [...new Set(allCategories.map((c) => c.category).filter(Boolean))].sort()
    const categories2 = [...new Set(allCategories.map((c) => c.category_2).filter(Boolean))].sort()
    const categories3 = [...new Set(allCategories.map((c) => c.category_3).filter(Boolean))].sort()

    let filtered3WayCategories = allCategories.filter((c) => c.category && c.category_2 && c.category_3)
    let filtered2WayCategories = allCategories.filter((c) => c.category && c.category_2)

    if (category1List.length > 0) {
      filtered3WayCategories = filtered3WayCategories.filter((c) => category1List.includes(c.category))
      filtered2WayCategories = filtered2WayCategories.filter((c) => category1List.includes(c.category))
    }

    if (category2List.length > 0) {
      filtered3WayCategories = filtered3WayCategories.filter((c) => category2List.includes(c.category_2))
      filtered2WayCategories = filtered2WayCategories.filter((c) => category2List.includes(c.category_2))
    }

    if (category3List.length > 0) {
      filtered3WayCategories = filtered3WayCategories.filter((c) => category3List.includes(c.category_3))
    }

    const threeWayTuples = Array.from(
      new Set(
        filtered3WayCategories.map((c) =>
          JSON.stringify({
            category: c.category,
            category_2: c.category_2,
            category_3: c.category_3,
          }),
        ),
      ),
    ).map((str) => JSON.parse(str))

    const twoWayTuples = Array.from(
      new Set(
        filtered2WayCategories.map((c) =>
          JSON.stringify({
            category: c.category,
            category_2: c.category_2,
          }),
        ),
      ),
    ).map((str) => JSON.parse(str))

    // combine and sort all tuples
    const categoryTuples = [...threeWayTuples, ...twoWayTuples].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      if (a.category_2 !== b.category_2) return a.category_2.localeCompare(b.category_2)
      const aCat3 = a.category_3 || ""
      const bCat3 = b.category_3 || ""
      return aCat3.localeCompare(bCat3)
    })

    return {
      data: {
        category: categories,
        category_2: categories2,
        category_3: categories3,
        tuples: categoryTuples,
      },
      error: null,
    }
  },

  async getRelatedStoreProducts(id: string, limit: number = 5) {
    const supabase = createClient()
    const { data: currentProduct, error } = await supabase.from("store_products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching store product:", error)
      return {
        data: null,
        error: error,
      }
    }

    if (!currentProduct) {
      return {
        data: null,
        error: "Product not found",
      }
    }

    // Get products with same brand
    const { data: sameBrandProducts, error: brandError } = await supabase
      .from("store_products")
      .select("*")
      .eq("brand", currentProduct.brand)
      .neq("id", id)
      .limit(limit)

    if (brandError) {
      console.error("Error fetching same brand products:", brandError)
      return {
        data: null,
        error: brandError,
      }
    }

    // Get products with same category
    const { data: sameCategoryProducts, error: categoryError } = await supabase
      .from("store_products")
      .select("*")
      .eq("category", currentProduct.category)
      .neq("id", id)
      .neq("brand", currentProduct.brand) // Exclude products we already found by brand
      .limit(limit)

    if (categoryError) {
      console.error("Error fetching same category products:", categoryError)
      return {
        data: null,
        error: categoryError,
      }
    }

    // Get products with similar name using text search
    const { data: similarNameProducts, error: nameError } = await supabase
      .from("store_products")
      .select("*")
      .textSearch("name", currentProduct.name?.split(" ").slice(0, 3).join(" & ") || "")
      .neq("id", id)
      .neq("brand", currentProduct.brand) // Exclude products we already found
      .not("category", "eq", currentProduct.category) // Exclude products we already found
      .limit(limit)

    if (nameError) {
      console.error("Error fetching similar name products:", nameError)
      return {
        data: null,
        error: nameError,
      }
    }

    // Combine all results, removing duplicates by id
    const allProducts = [...(sameBrandProducts || []), ...(sameCategoryProducts || []), ...(similarNameProducts || [])]
    const uniqueProducts = Array.from(new Map(allProducts.map((item) => [item.id, item])).values())

    return {
      data: uniqueProducts,
      error: null,
    }
  },

  async getAllEmptyByOriginId(originId: number) {
    const supabase = createClient()
    const pageSize = 1000 // Large page size to minimize requests but avoid timeouts
    let allProducts: StoreProduct[] = []
    let hasMore = true
    let page = 0

    while (hasMore) {
      const { data, error, count } = await supabase
        .from("store_products")
        .select("*", { count: "exact" })
        .is("name", null)
        .eq("origin_id", originId)
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error("Error fetching products:", error)
        return { data: null, error }
      }

      if (!data?.length) {
        hasMore = false
        break
      }

      allProducts = [...allProducts, ...data]

      // Check if we've fetched all records
      if (count && allProducts.length >= count) {
        hasMore = false
      }

      page++
    }

    return { data: allProducts, error: null }
  },

  async getAllNullPriority({ offset = 0, limit = 100 }: { offset?: number; limit?: number }) {
    const supabase = createClient()
    return supabase
      .from("store_products")
      .select("*")
      .is("priority", null)
      .range(offset, offset + limit - 1)
  },

  async getAllByPriority(priority: number | null, { offset = 0, limit = 100 }: { offset?: number; limit?: number }) {
    if (priority !== null && (priority < 0 || priority > 5 || !Number.isInteger(priority))) {
      return {
        data: null,
        error: {
          message: "Priority must be null or an integer between 0 and 5",
          status: 400,
        },
      }
    }

    const supabase = createClient()
    return supabase
      .from("store_products")
      .select("*")
      .eq("priority", priority)
      .range(offset, offset + limit - 1)
  },

  async getUnsyncedHighPriority() {
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_unsynced_high_priority_products") // TODO: fix this because sync job is not correct

    if (error) {
      console.error("Error fetching unsynced high priority products:", error)
    }

    return { data, error }
  },

  async getStaleByPriority({
    offset = 0,
    limit = 10,
    ignoreHours = false,
  }: {
    offset?: number
    limit?: number
    ignoreHours?: boolean
  }) {
    const isDev = process.env.NODE_ENV === "development"
    const priorityMap = [
      { level: 5, hours: 8 },
      { level: 4, hours: 12 },
      { level: 3, hours: 24 },
      { level: 2, hours: 1 },
      { level: 1, hours: 1 },
    ].filter(Boolean) as { level: number; hours: number }[]

    const supabase = createClient()
    const query = supabase
      .from("store_products")
      .select("*", { count: "exact" })
      .in("priority", isDev ? [5, 4, 3, 2, 1] : [5, 4, 3])
      .order("priority", { ascending: false })
      .range(offset, offset + limit - 1)

    if (!ignoreHours) {
      const priorityConditions = priorityMap.map(
        ({ level, hours }) =>
          `and(priority.eq.${level},updated_at.lt.${new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()})`,
      )
      query.or(priorityConditions.join(","))
    }

    const { data, count, error } = await query

    return {
      data,
      error,
      pagination: {
        total: count ?? 0,
        offset,
        limit,
      },
    }
  },

  async addProductFromObject(sp: StoreProduct) {
    const supabase = createClient()
    const { data, error } = await supabase.from("store_products").insert([sp]).select().single()
    return { data, error }
  },
}
