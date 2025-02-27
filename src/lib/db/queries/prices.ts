import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

export const priceQueries = {
  async updatePriceEntry(product: Product) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").upsert({
      product_id: product.id,
      price: product.price,
    })
  },
}
