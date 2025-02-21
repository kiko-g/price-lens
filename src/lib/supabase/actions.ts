import { Product } from "@/types"
import { createClient } from "@/lib/supabase/server"

export const createEmptyProduct = (): Product => {
  const emptyProduct: Record<keyof Product, any> = {} as Product

  for (const key of Object.keys(emptyProduct) as (keyof Product)[]) {
    emptyProduct[key] = null
  }

  return emptyProduct as Product
}

export async function createOrUpdateProduct(product: Product) {
  const supabase = createClient()
  const { data: existingProduct } = await supabase.from("products").select("created_at").eq("url", product.url).single()

  const productToUpsert = {
    ...product,
    created_at: product.created_at || existingProduct?.created_at || product.updated_at,
  }

  const { data, error } = await supabase.from("products").upsert(productToUpsert, {
    onConflict: "url",
    ignoreDuplicates: false,
  })

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
