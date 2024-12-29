import { Product } from "@/types"
import { createClient } from "@/lib/supabase/server"

export const createEmptyProduct = (): Product => {
  const emptyProduct: Record<keyof Product, any> = {} as Product

  for (const key of Object.keys(emptyProduct) as (keyof Product)[]) {
    emptyProduct[key] = null
  }

  return emptyProduct as Product
}

export const createOrUpdateProduct = async (product: Product) => {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").upsert(product)
  return { data, error }
}
