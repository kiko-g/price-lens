import { arePricePointsEqual } from "@/lib/pricing"
import { createClient } from "@/lib/supabase/server"
import { now } from "@/lib/utils"
import type { Price, PricesWithAnalytics, PriceAnalytics, PricePoint } from "@/types"

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

  async getPricePointsPerIndividualProduct(store_product_id: number) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("store_product_id", store_product_id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching price points:", error)
      return null
    }

    return data
  },

  async getPricePointsWithAnalytics(store_product_id: number): Promise<PricesWithAnalytics | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("store_product_id", store_product_id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching price points:", error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        prices: [],
        analytics: {
          pricePoints: null,
          mostCommon: null,
          floor: 0,
          ceiling: 0,
          variations: {
            price: 0,
            priceRecommended: 0,
            pricePerMajorUnit: 0,
            discount: 0,
          },
          dateRange: {
            minDate: null,
            maxDate: null,
            daysBetween: 0,
          },
        },
      }
    }

    // Compute price point analysis
    const uniqueMap = new Map()
    let totalDuration = 0
    const now = new Date()

    data.forEach((item) => {
      if (!item.valid_from) return
      const key = `${item.price}-${item.price_recommended}-${item.price_per_major_unit}`
      const validFrom = new Date(item.valid_from)
      const validTo = item.valid_to ? new Date(item.valid_to) : now
      const duration = validTo.getTime() - validFrom.getTime()
      totalDuration += duration

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          price: item.price,
          price_recommended: item.price_recommended,
          price_per_major_unit: item.price_per_major_unit,
          discount: item.discount,
          totalDuration: duration,
          occurrences: 1,
        })
      } else {
        const existing = uniqueMap.get(key)
        existing.totalDuration += duration
        existing.occurrences += 1
      }
    })

    const pricePoints = Array.from(uniqueMap.values())
      .map((pricePoint: PricePoint) => ({
        ...pricePoint,
        frequencyRatio: pricePoint.totalDuration / totalDuration,
        averageDurationDays: pricePoint.totalDuration / (1000 * 60 * 60 * 24) / pricePoint.occurrences,
      }))
      .sort((a, b) => b.frequencyRatio - a.frequencyRatio)

    const mostCommon = pricePoints.length > 0 ? pricePoints[0] : null

    // Compute floor and ceiling for all price types
    const allPrices = data
      .flatMap((p) => [p.price, p.price_recommended, p.price_per_major_unit])
      .filter((price) => price !== null && price !== undefined)

    const floor = allPrices.length > 0 ? Math.floor(Math.min(...allPrices)) : 0
    const ceiling = allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 0

    // Compute variations (percentage change between last two prices)
    const lastTwoPrices = data.slice(-2)
    let variations = {
      price: 0,
      priceRecommended: 0,
      pricePerMajorUnit: 0,
      discount: 0,
    }

    if (lastTwoPrices.length >= 2) {
      const current = lastTwoPrices[1]
      const previous = lastTwoPrices[0]

      if (previous.price && current.price) {
        variations.price = (current.price - previous.price) / previous.price
      }
      if (previous.price_recommended && current.price_recommended) {
        variations.priceRecommended =
          (current.price_recommended - previous.price_recommended) / previous.price_recommended
      }
      if (previous.price_per_major_unit && current.price_per_major_unit) {
        variations.pricePerMajorUnit =
          (current.price_per_major_unit - previous.price_per_major_unit) / previous.price_per_major_unit
      }
      if (previous.discount !== null && current.discount !== null) {
        variations.discount = current.discount - previous.discount
      }
    }

    // Compute date range
    const minDate = data.reduce<string | null>((min, price) => {
      const validFrom = price.valid_from ?? null
      const updatedAt = price.updated_at ?? null

      if (validFrom === null && updatedAt === null) return min
      if (min === null) return validFrom !== null ? validFrom : updatedAt
      if (validFrom !== null && validFrom < min) return validFrom
      if (updatedAt !== null && updatedAt < min) return updatedAt

      return min
    }, null)

    const maxDate = data.reduce<string | null>((max, price) => {
      const validTo = price.valid_to ?? null
      const updatedAt = price.updated_at ?? null

      if (validTo === null && updatedAt === null) return max
      if (max === null) return validTo !== null ? validTo : updatedAt
      if (validTo !== null && validTo > max) return validTo

      return max
    }, null)

    const daysBetween =
      minDate && maxDate
        ? Math.ceil((new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return {
      prices: data,
      analytics: {
        pricePoints: pricePoints.length > 0 ? pricePoints : null,
        mostCommon,
        floor,
        ceiling,
        variations,
        dateRange: {
          minDate,
          maxDate,
          daysBetween,
        },
      },
    }
  },

  async getLatestPricePoint(store_product_id: number) {
    const supabase = createClient()

    const { data, error } = await supabase.from("prices").select("*").eq("store_product_id", store_product_id)

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
      .order("store_product_id", { ascending: true })
      .order("valid_from", { ascending: false })

    if (error) {
      console.error("Error fetching price points:", error)
      return null
    }

    for (let i = 0; i < data.length - 1; i++) {
      const p1 = data[i]
      const p2 = data[i + 1]

      if (p1.store_product_id !== p2.store_product_id) continue

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
