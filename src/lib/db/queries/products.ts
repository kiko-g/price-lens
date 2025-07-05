import type { GetAllQuery } from "@/types/extra"
import { createClient } from "@/lib/supabase/server"
import type { Product, ProductLinked, ProductQueryType, StoreProduct } from "@/types"
import type { SearchType, SortByType } from "@/types/extra"
import { PostgrestError } from "@supabase/supabase-js"

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
    productQueryType = "all",
    offset = 0,
    limit = 10,
    q = "",
  }: {
    productQueryType?: ProductQueryType
    offset?: number
    limit?: number
    q?: string
  }): Promise<{
    data: (Product & { store_products: StoreProduct[] })[]
    error: PostgrestError | null
    pagination: { total: number; offset: number; limit: number } | null
  }> {
    const supabase = createClient()

    // ---------- build base query ----------
    let query = supabase.from("products").select("*", { count: "exact" }).order("name")

    // essential filter
    if (productQueryType === "essential") query = query.eq("essential", true)
    else if (productQueryType === "non-essential") query = query.eq("essential", false)

    // free-text search (min 3 chars)
    if (q && q.trim().length >= 3) {
      const sanitized = q.replace(/[^\p{L}\p{N}\s]/gu, "").trim()
      query = query.ilike("name", `%${sanitized}%`)
    }

    // pagination
    query = query.range(offset, offset + limit - 1)

    // ---------- run first query ----------
    const { data: products = [], error: productsError, count } = await query

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return { data: [], error: productsError, pagination: null }
    }

    if (!products || products.length === 0) {
      return {
        data: [],
        error: null,
        pagination: { total: count ?? 0, offset, limit },
      }
    }

    // ---------- gather all referenced store-product IDs ----------
    const refIds = products.flatMap((p) => p.product_ref_ids ?? [])
    if (refIds.length === 0) {
      return {
        data: products.map((p) => ({ ...p, store_products: [] })),
        error: null,
        pagination: { total: count ?? 0, offset, limit },
      }
    }

    // ---------- second query ----------
    const { data: storeProducts = [], error: storeProductsError } = await supabase
      .from("store_products")
      .select("*")
      .in("id", refIds)

    if (storeProductsError) {
      console.error("Error fetching store products:", storeProductsError)
      return {
        data: products.map((p) => ({ ...p, store_products: [] })),
        error: storeProductsError,
        pagination: { total: count ?? 0, offset, limit },
      }
    }

    if (!storeProducts || storeProducts.length === 0) {
      return {
        data: products.map((p) => ({ ...p, store_products: [] })),
        error: null,
        pagination: { total: count ?? 0, offset, limit },
      }
    }

    // ---------- attach children ----------
    const byId = new Map(storeProducts.map((sp) => [String(sp.id), sp]))
    const linked = products.map((p) => ({
      ...p,
      store_products: (p.product_ref_ids ?? [])
        .map((id: string) => byId.get(String(id)))
        .filter(Boolean) as StoreProduct[],
    }))

    return {
      data: linked,
      error: null,
      pagination: { total: count ?? 0, offset, limit },
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

    const deletePriceRes = await supabase.from("prices").delete().eq("product_id", id)
    if (deletePriceRes.error) {
      console.error("Error deleting price points:", deletePriceRes.error)
      return {
        data: null,
        error: deletePriceRes.error,
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

  async toggleEssential(id: number) {
    const supabase = createClient()
    const selectRes = await supabase.from("products").select("essential").eq("id", id).single()

    if (selectRes.error) {
      console.error("Error fetching product:", selectRes.error)
      return {
        data: null,
        error: selectRes.error,
      }
    }

    const newEssential = selectRes.data.essential !== null ? !selectRes.data.essential : false
    const updateRes = await supabase.from("products").update({ essential: newEssential }).eq("id", id)

    if (updateRes.error) {
      console.error("Error updating product:", updateRes.error)
      return {
        data: null,
        error: updateRes.error,
      }
    }

    return {
      data: newEssential,
      error: null,
    }
  },

  async getStoreProduct(product: Product, storeProductId: number | null) {
    const supabase = createClient()

    const firstRefId = product.product_ref_ids[0]
    const resolvedId = storeProductId
      ? product.product_ref_ids.find((id) => id === storeProductId.toString()) || firstRefId
      : firstRefId

    if (!resolvedId)
      return {
        data: null,
        error: "No resolved id",
      }

    const { data, error } = await supabase.from("store_products").select("*").eq("id", resolvedId).single()

    return { data, error }
  },

  async createProductLinkedProduct(sp: StoreProduct) {
    if (sp.is_tracked) {
      return {
        data: null,
        error: "Product is already tracked",
      }
    }

    const supabase = createClient()
    return supabase.from("products").insert({
      name: sp.name,
      brand: sp.brand,
      category: sp.category,
      product_ref_ids: [sp.id],
    })
  },
}

export const storeProductQueries = {
  async getAll({
    page = 1,
    limit = 30,
    query = "",
    searchType = "name",
    nonNulls = true,
    sort = "a-z",
    categories = [],
    category = null,
    category2 = null,
    category3 = null,
    originId = null,
    options = {
      onlyDiscounted: false,
    },
  }: GetAllQuery) {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let dbQuery = supabase.from("store_products").select("*", { count: "exact" })

    if (sort && sort === "only-nulls") {
      dbQuery = dbQuery.is("name", null)
      dbQuery = dbQuery.order("url", { ascending: true })
      return dbQuery.range(offset, offset + limit - 1)
    }

    if (originId !== null) dbQuery = dbQuery.eq("origin_id", originId)

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

        // const formattedQuery = sanitizedQuery
        //   .split(/\s+/)        // break on one or more whitespace characters
        //   .filter(Boolean)     // remove empty elements
        //   .join(" & ")         // join terms with AND
        // if (formattedQuery) {
        //   dbQuery = dbQuery.textSearch(searchType, formattedQuery)
        // }
      }
    }

    // Handle individual category parameters (takes precedence over categories array)
    if (category && category2 && category3) {
      dbQuery = dbQuery.eq("category", category).eq("category_2", category2).eq("category_3", category3)
    } else if (categories && categories.length !== 0) {
      dbQuery = dbQuery.in("category", categories) // FIXME: using main category, consider more
    }

    if (options.onlyDiscounted) {
      dbQuery = dbQuery.gt("discount", 0)
    }

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

    return dbQuery.range(offset, offset + limit - 1)
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

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from("store_products").select("*").eq("id", id).single()
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

  async upsertBlank({ url, created_at }: { url: string; created_at: string }) {
    const supabase = createClient()
    return supabase.from("store_products").upsert(
      {
        url,
        created_at,
      },
      {
        onConflict: "url",
        ignoreDuplicates: false,
      },
    )
  },

  async setIsTracked(id: number, is_tracked: boolean) {
    const supabase = createClient()
    return supabase.from("store_products").update({ is_tracked }).eq("id", id)
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
      created_at: sp.created_at || existingProduct?.created_at || sp.updated_at,
    }

    const { data, error } = await supabase.from("store_products").upsert(productToUpsert, {
      onConflict: "url",
      ignoreDuplicates: false,
    })

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
    const PAGE_SIZE = 1000 // Supabase's max limit
    let allCategories: { category: string; category_2: string; category_3: string }[] = []
    let page = 0
    let hasMore = true

    // Fetch all categories using pagination
    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from("store_products")
        .select("category, category_2, category_3")
        .eq("origin_id", "2")
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

    // Get unique individual category values
    const categories = [...new Set(allCategories.map((c) => c.category).filter(Boolean))].sort()
    const categories2 = [...new Set(allCategories.map((c) => c.category_2).filter(Boolean))].sort()
    const categories3 = [...new Set(allCategories.map((c) => c.category_3).filter(Boolean))].sort()

    // Filter tuples based on provided categories
    let filteredCategories = allCategories.filter((c) => c.category && c.category_2 && c.category_3)

    if (category1List.length > 0) {
      filteredCategories = filteredCategories.filter((c) => category1List.includes(c.category))
    }

    if (category2List.length > 0) {
      filteredCategories = filteredCategories.filter((c) => category2List.includes(c.category_2))
    }

    if (category3List.length > 0) {
      filteredCategories = filteredCategories.filter((c) => category3List.includes(c.category_3))
    }

    // Get unique 3-way tuples (category, category_2, category_3)
    const categoryTuples = Array.from(
      new Set(
        filteredCategories.map((c) =>
          JSON.stringify({
            category: c.category,
            category_2: c.category_2,
            category_3: c.category_3,
          }),
        ),
      ),
    )
      .map((str) => JSON.parse(str))
      .sort((a, b) => {
        // Sort by category, then category_2, then category_3
        if (a.category !== b.category) return a.category.localeCompare(b.category)
        if (a.category_2 !== b.category_2) return a.category_2.localeCompare(b.category_2)
        return a.category_3.localeCompare(b.category_3)
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
}
