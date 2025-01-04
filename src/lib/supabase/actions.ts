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

export const getAllProductUrls = async () => {
  const batchSize = 1000
  const supabase = createClient()

  let allUrls: string[] = []
  let from = 0
  let to = batchSize - 1
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase.from("products").select("url").range(from, to)

    if (error) {
      console.error("Error fetching product URLs:", error)
      return []
    }

    if (data) {
      allUrls = [...allUrls, ...data.map((product) => product.url)]
      if (data.length < batchSize) hasMore = false
      else {
        from += batchSize
        to += batchSize
      }
    }
  }

  return allUrls
}
