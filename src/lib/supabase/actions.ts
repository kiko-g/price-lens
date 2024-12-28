import { Product } from "@/types"
import { createClient } from "@/lib/supabase/server"

export const createOrUpdateProduct = async (product: Product) => {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").upsert(product)
  return { data, error }
}
