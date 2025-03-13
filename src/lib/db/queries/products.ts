import { createClient } from "@/lib/supabase/server"
import type { Product, ProductFromSupermarket, SupermarketProduct } from "@/types"
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
    return supabase.from("products").select("*")
  },

  async getAllAttached() {
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
      supermarket_products: [],
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

    const { data: supermarketProducts, error: supermarketError } = await supabase
      .from("supermarket_products")
      .select("*")
      .in("id", allRefIds)

    if (supermarketError) {
      console.error("Error fetching supermarket products:", supermarketError)
      return {
        error: supermarketError,
        data: emptyProducts,
      }
    }

    const productsWithSupermarket = products.map((p) => {
      const matchingSupermarketProducts = supermarketProducts.filter((sp) => p.product_ref_ids.includes(sp.id)) || []
      return {
        ...p,
        supermarket_products: matchingSupermarketProducts,
      }
    })

    return {
      error: null,
      data: productsWithSupermarket,
    }
  },

  async getSupermarketProduct(product: Product, supermarketProductId: number | null) {
    const supabase = createClient()

    const firstRefId = product.product_ref_ids[0]
    const resolvedId = supermarketProductId
      ? product.product_ref_ids.find((id) => id === supermarketProductId.toString()) || firstRefId
      : firstRefId

    if (!resolvedId)
      return {
        data: null,
        error: "No resolved id",
      }

    const { data, error } = await supabase.from("supermarket_products").select("*").eq("id", resolvedId).single()

    return { data, error }
  },

  async createProductFromSupermarketProduct(sp: SupermarketProduct) {
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

export const supermarketProductQueries = {
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

    let dbQuery = supabase.from("supermarket_products").select("*", { count: "exact" })

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
        dbQuery = dbQuery.textSearch(searchType, sanitizedQuery)
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
      .from("supermarket_products")
      .select("*", { count: "exact" })
      .is("name", null)
      .range(offset, offset + limit - 1)
  },

  async getInvalid() {
    const supabase = createClient()
    return supabase
      .from("supermarket_products")
      .select("*")
      .not("url", "is", null)
      .not("created_at", "is", null)
      .is("name", null)
  },

  async getUncharted() {
    const supabase = createClient()
    return supabase.from("supermarket_products").select("*").is("created_at", null)
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from("supermarket_products").select("*").eq("id", id).single()
    return { data, error }
  },

  async getByIds(ids: string[]) {
    const supabase = createClient()
    return supabase.from("supermarket_products").select("*").in("id", ids)
  },

  async getByUrlSubstrs(substrs: string[]) {
    const supabase = createClient()
    return supabase
      .from("supermarket_products")
      .select("*")
      .ilike("url", `%${substrs.join("%")}%`)
  },

  async upsert(sp: SupermarketProduct) {
    const supabase = createClient()
    return supabase.from("supermarket_products").upsert(sp, {
      onConflict: "url",
      ignoreDuplicates: false,
    })
  },

  async upsertBlank({ url, created_at }: { url: string; created_at: string }) {
    const supabase = createClient()
    return supabase.from("supermarket_products").upsert(
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
    return supabase.from("supermarket_products").update({ is_tracked }).eq("id", id)
  },

  async createOrUpdateProduct(sp: SupermarketProduct) {
    const supabase = createClient()
    const { data: existingProduct } = await supabase
      .from("supermarket_products")
      .select("created_at")
      .eq("url", sp.url)
      .single()

    const productToUpsert = {
      ...sp,
      created_at: sp.created_at || existingProduct?.created_at || sp.updated_at,
    }

    const { data, error } = await supabase.from("supermarket_products").upsert(productToUpsert, {
      onConflict: "url",
      ignoreDuplicates: false,
    })

    return { data, error }
  },

  async getAllCategories() {
    const supabase = createClient()

    const { data: category, error: categoryError } = await supabase
      .from("supermarket_products")
      .select("category")
      .not("category", "is", null)

    const { data: category2, error: category2Error } = await supabase
      .from("supermarket_products")
      .select("category_2")
      .not("category_2", "is", null)

    const { data: category3, error: category3Error } = await supabase
      .from("supermarket_products")
      .select("category_3")
      .not("category_3", "is", null)

    if (categoryError || category2Error || category3Error) {
      return {
        data: null,
        error: categoryError || category2Error || category3Error,
      }
    }

    return {
      data: {
        category: [...new Set(category?.map((c) => c.category).filter(Boolean))].sort(),
        category_2: [...new Set(category2?.map((c) => c.category_2).filter(Boolean))].sort(),
        category_3: [...new Set(category3?.map((c) => c.category_3).filter(Boolean))].sort(),
      },
      error: null,
    }
  },
}
