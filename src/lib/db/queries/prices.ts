import { arePricePointsEqual } from "@/lib/pricing"
import { createClient } from "@/lib/supabase/server"
import { now } from "@/lib/utils"
import type { Price } from "@/types"

export const priceQueries = {
  async getPrices() {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").select("*")

    if (error) {
      console.error("Error fetching price points:", error)
      return null
    }

    return data
  },

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

  async updatePricePointUpdatedAt(id: number) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").update({ updated_at: now() }).eq("id", id)

    if (error) {
      console.error("Error updating price point updated at:", error)
      return null
    }

    return data
  },

  async closeExistingPricePoint(id: number, newPrice: Price) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .update({
        valid_to: newPrice.valid_from,
        updated_at: now(),
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

  async deletePricePoint(id: number) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting price point:", error)
      return null
    }

    return data
  },

  async deleteDuplicatePricePoints() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .order("supermarket_product_id", { ascending: true })
      .order("valid_from", { ascending: false })

    if (error) {
      console.error("Error fetching price points:", error)
      return null
    }

    for (let i = 0; i < data.length - 1; i++) {
      const p1 = data[i]
      const p2 = data[i + 1]

      if (p1.supermarket_product_id !== p2.supermarket_product_id) continue

      if (arePricePointsEqual(p1, p2)) {
        await this.deletePricePoint(p1.id)
      }
    }
  },

  async deleteAllPricePoints() {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").select("*")

    if (error || !data) {
      console.error("Error deleting price points:", error)
      return null
    }

    for (const price of data) {
      await this.deletePricePoint(price.id)
    }

    return data
  },
}
