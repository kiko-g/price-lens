import { createClient } from "@/lib/supabase/server"
import type { SupermarketProduct } from "@/types"

export const priceQueries = {
  async updatePriceEntry(product: SupermarketProduct) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").upsert({
      product_id: product.id,
      price: product.price,
    })
  },
}
