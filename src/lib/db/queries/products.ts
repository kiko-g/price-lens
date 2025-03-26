import { createClient } from "@/lib/supabase/server"
import type { Product, ProductLinked, StoreProduct } from "@/types"
import type { SearchType, SortByType } from "@/types/extra"

type GetAllQuery = {
  page: number
  limit: number
  query?: string
  sort?: SortByType
  searchType?: SearchType
  nonNulls?: boolean
  categories?: string[]
  options?: {
    onlyDiscounted: boolean
  }
}

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

  async getAllLinked() {
    const supabase = createClient()

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true })

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return {
        data: [],
        error: productsError,
      }
    }

    const emptyProducts = products.map((product) => ({
      ...product,
      store_products: [],
    }))

    if (!products || products.length === 0) {
      return {
        data: emptyProducts,
        error: "No products found",
      }
    }

    const allRefIds = products.flatMap((product) => product.product_ref_ids)
    if (allRefIds.length === 0) {
      return {
        error: null,
        data: emptyProducts,
      }
    }

    const { data: storeProducts, error: storeProductsError } = await supabase
      .from("store_products")
      .select("*")
      .in("id", allRefIds)

    if (storeProductsError) {
      console.error("Error fetching store products:", storeProductsError)
      return {
        error: storeProductsError,
        data: emptyProducts,
      }
    }

    const productsLinked = products.map((p) => {
      const matchingStoreProducts = storeProducts.filter((sp) => p.product_ref_ids.includes(sp.id)) || []
      return {
        ...p,
        store_products: matchingStoreProducts,
      }
    })

    return {
      error: null,
      data: productsLinked,
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
    limit = 20,
    query = "",
    searchType = "name",
    nonNulls = true,
    sort = "a-z",
    categories = [],
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

    if (nonNulls) dbQuery = dbQuery.not("name", "eq", "").not("name", "is", null)

    if (query) {
      const sanitizedQuery = query.replace(/[^a-zA-Z0-9\sÀ-ÖØ-öø-ÿ]/g, "").trim()
      if (searchType === "url") {
        dbQuery = dbQuery.ilike(searchType, `%${sanitizedQuery}%`)
      } else {
        // The issue is that textSearch requires a specific format for multi-word queries
        // For PostgreSQL's ts_query, words need to be connected with operators like & (AND) or | (OR)
        // Simply passing a space-separated string doesn't work correctly
        const formattedQuery = sanitizedQuery.split(/\s+/).filter(Boolean).join(" & ")
        if (formattedQuery) {
          dbQuery = dbQuery.textSearch(searchType, formattedQuery)
        }
      }
    }

    if (categories && categories.length !== 0) {
      dbQuery = dbQuery.in("category_3", categories)
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

  async getAllCategories() {
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

    return {
      data: {
        category: categories,
        category_2: categories2,
        category_3: categories3,
      },
      error: null,
    }
  },
}
