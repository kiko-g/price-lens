import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

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
  async getAll({ page = 1, limit = 20, query = "" }: { page: number; limit: number; query?: string }) {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let dbQuery = supabase.from("products").select("*", { count: "exact" })

    if (query) {
      const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      dbQuery = dbQuery.ilike("name", `%${normalizedQuery}%`)
    }

    return dbQuery.range(offset, offset + limit - 1)
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
