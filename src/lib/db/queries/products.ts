import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

export const productQueries = {
  async getAll({ page = 1, limit = 20, query }: { page: number; limit: number; query?: string }) {
    const supabase = createClient()
    const offset = (page - 1) * limit

    let dbQuery = supabase.from("products").select("*", { count: "exact" })

    if (query) {
      const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      dbQuery = dbQuery.ilike("name", `%${normalizedQuery}%`)
    }

    return dbQuery.range(offset, offset + limit - 1)
  },

  async upsert(product: Product) {
    const supabase = createClient()
    return supabase.from("products").upsert(product, {
      onConflict: "url",
      ignoreDuplicates: false,
    })
  },
}
