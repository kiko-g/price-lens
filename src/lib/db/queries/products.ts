import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"
import type { SearchType, SortByType } from "@/types/extra"

type GetAllQuery = {
  page: number
  limit: number
  query?: string
  sort?: SortByType
  searchType?: SearchType
  nonNulls?: boolean
}

export const selectedProducts = [
  {
    id: "2575",
    name: "Leite Meio Gordo Pastagem",
  },
  {
    id: "3526",
    name: "Gelado Cheesecake Morango",
  },
  {
    id: "5912",
    name: "Creatina Creapure",
  },
]

export const productQueries = {
  async getAll({ page = 1, limit = 20, query = "", searchType = "name", nonNulls = true, sort = "a-z" }: GetAllQuery) {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let dbQuery = supabase.from("products").select("*", { count: "exact" })

    if (sort && sort === "only-nulls") {
      dbQuery = dbQuery.is("name", null)
      dbQuery = dbQuery.order("url", { ascending: true })
      return dbQuery.range(offset, offset + limit - 1)
    }

    if (nonNulls) dbQuery = dbQuery.not("name", "eq", "").not("name", "is", null)

    if (query) {
      const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      dbQuery = dbQuery.ilike(searchType, `%${normalizedQuery}%`)
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
      .from("products")
      .select("*", { count: "exact" })
      .is("name", null)
      .range(offset, offset + limit - 1)
  },

  async getInvalid() {
    const supabase = createClient()
    return supabase.from("products").select("*").not("url", "is", null).not("created_at", "is", null).is("name", null)
  },

  async getUncharted() {
    const supabase = createClient()
    return supabase.from("products").select("*").is("created_at", null)
  },

  async getByIds(ids: string[]) {
    const supabase = createClient()
    return supabase.from("products").select("*").in("id", ids)
  },

  async getByUrlSubstrs(substrs: string[]) {
    const supabase = createClient()
    return supabase
      .from("products")
      .select("*")
      .ilike("url", `%${substrs.join("%")}%`)
  },

  async upsert(product: Product) {
    const supabase = createClient()
    return supabase.from("products").upsert(product, {
      onConflict: "url",
      ignoreDuplicates: false,
    })
  },

  async upsertBlank({ url, created_at }: { url: string; created_at: string }) {
    const supabase = createClient()
    return supabase.from("products").upsert(
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
}
