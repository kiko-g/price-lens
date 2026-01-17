import { arePricePointsEqual } from "@/lib/pricing"
import { createClient } from "@/lib/supabase/server"
import { now } from "@/lib/utils"
import type { Price, PricesWithAnalytics, PricePoint } from "@/types"

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

  async getPricesPaginated(params: { page: number; limit: number }) {
    const supabase = createClient()
    const { page, limit } = params
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from("prices")
      .select("*", { count: "exact" })
      .order("store_product_id", { ascending: true })
      .order("valid_from", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching paginated prices:", error)
      return { data: null, pagination: null, error }
    }

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      error: null,
    }
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
    const variations = {
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

    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("store_product_id", store_product_id)
      .order("valid_from", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found - not an error, just no price history
        return null
      }
      console.error("Error fetching price entry:", error)
      return null
    }

    return data
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

  async deletePricePoint(id: number): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await supabase.from("prices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting price point:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  /**
   * Closes the latest open price point for a store product
   * Used when a product becomes unavailable (404) to mark the end of its price validity
   */
  async closeLatestPricePoint(storeProductId: number): Promise<{ closed: boolean; error?: string }> {
    const supabase = createClient()

    // Find the latest open price point (valid_to is null)
    const { data: latestPrice, error: fetchError } = await supabase
      .from("prices")
      .select("id")
      .eq("store_product_id", storeProductId)
      .is("valid_to", null)
      .order("valid_from", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching latest price point:", fetchError)
      return { closed: false, error: fetchError.message }
    }

    if (!latestPrice) {
      // No open price point to close
      return { closed: false }
    }

    // Close it by setting valid_to to now
    const { error: updateError } = await supabase
      .from("prices")
      .update({ valid_to: now(), updated_at: now() })
      .eq("id", latestPrice.id)

    if (updateError) {
      console.error("Error closing price point:", updateError)
      return { closed: false, error: updateError.message }
    }

    console.info(`[Prices] Closed price point ${latestPrice.id} for store product ${storeProductId}`)
    return { closed: true }
  },

  async getDuplicatePricePointsStats() {
    const supabase = createClient()

    const { data, error, count } = await supabase
      .from("prices")
      .select("*", { count: "exact" })
      .order("store_product_id", { ascending: true })
      .order("valid_from", { ascending: false })

    if (error || !data) {
      console.error("Error fetching price points:", error)
      return null
    }

    const duplicateIds: number[] = []
    const affectedStoreProductIds = new Set<number>()

    for (let i = 0; i < data.length - 1; i++) {
      const p1 = data[i]
      const p2 = data[i + 1]

      if (p1.store_product_id !== p2.store_product_id) continue

      if (arePricePointsEqual(p1, p2)) {
        duplicateIds.push(p1.id)
        if (p1.store_product_id) affectedStoreProductIds.add(p1.store_product_id)
      }
    }

    return {
      totalPricePoints: count ?? data.length,
      duplicateCount: duplicateIds.length,
      affectedProductsCount: affectedStoreProductIds.size,
      duplicateIds,
    }
  },

  async deleteDuplicatePricePoints() {
    const stats = await this.getDuplicatePricePointsStats()

    if (!stats) {
      return { deleted: 0, error: "Failed to get duplicate stats" }
    }

    if (stats.duplicateIds.length === 0) {
      return { deleted: 0, stats }
    }

    let deletedCount = 0
    for (const id of stats.duplicateIds) {
      const result = await this.deletePricePoint(id)
      if (result.success) deletedCount++
    }

    return { deleted: deletedCount, stats }
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
