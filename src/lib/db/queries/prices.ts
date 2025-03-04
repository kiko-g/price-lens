import { createClient } from "@/lib/supabase/server"
import type { Price, SupermarketProduct } from "@/types"

export const priceQueries = {
  async getLatestPricePoint(product_id: number, supermarket_product_id: number) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("product_id", product_id)
      .eq("supermarket_product_id", supermarket_product_id)

    if (error) {
      console.error("Error fetching price entry:", error)
      return null
    }

    return data[data.length - 1]
  },

  async closeExistingPricePoint(id: number, newPrice: Price) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .update({
        valid_to: newPrice.valid_from,
      })
      .eq("id", id)

    if (error) {
      console.error("Error closing price point:", error)
      return null
    }

    await this.insertNewPricePoint(newPrice)

    return data
  },

  async insertNewPricePoint(price: Price) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").insert(price)

    if (error) {
      console.error("Error inserting price entry:", error)
      return null
    }

    return data
  },
}
