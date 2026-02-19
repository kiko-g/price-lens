import type { StoreProduct, Price } from "@/types"

import { now } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { priceQueries } from "@/lib/queries/prices"
import { storeProductQueries } from "@/lib/queries/products"

export function isValidPriceValue(value: number | null): boolean {
  return typeof value === "number" && !isNaN(value)
}

export function isValidPriceEntry(price: Price): boolean {
  const priceValues = [price.price, price.price_recommended, price.price_per_major_unit]
  return priceValues.some(isValidPriceValue)
}

export function mergePrices(a: Price, b: Price): Price {
  return {
    ...a,
    price: a.price ?? b.price,
    price_recommended: a.price_recommended ?? b.price_recommended,
    price_per_major_unit: a.price_per_major_unit ?? b.price_per_major_unit,
    discount: a.discount ?? b.discount,
    valid_from:
      a.valid_from && b.valid_from
        ? new Date(a.valid_from) > new Date(b.valid_from)
          ? a.valid_from
          : b.valid_from
        : (a.valid_from ?? b.valid_from),
    valid_to:
      a.valid_to === null || b.valid_to === null
        ? null
        : a.valid_to && b.valid_to
          ? new Date(a.valid_to) > new Date(b.valid_to)
            ? a.valid_to
            : b.valid_to
          : (a.valid_to ?? b.valid_to),
    created_at:
      a.created_at && b.created_at
        ? new Date(a.created_at) < new Date(b.created_at)
          ? a.created_at
          : b.created_at
        : (a.created_at ?? b.created_at),
    updated_at:
      a.updated_at && b.updated_at
        ? new Date(a.updated_at) > new Date(b.updated_at)
          ? a.updated_at
          : b.updated_at
        : (a.updated_at ?? b.updated_at),
  }
}

export function mergeAndSanitize(prices: Price[]): Price[] {
  if (!prices.length) return []

  const result: Price[] = []
  const sortedPrices = [...prices].sort((a, b) => {
    if (!a.store_product_id || !b.store_product_id) {
      console.error("Invalid price entry", a, b)
      return 0
    }

    if (a.store_product_id !== b.store_product_id) {
      return a.store_product_id - b.store_product_id
    }

    if (a.valid_from && b.valid_from) {
      return new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
    }

    return 0
  })

  let i = 0
  while (i < sortedPrices.length) {
    const current = sortedPrices[i]

    // Skip invalid entries
    if (!isValidPriceEntry(current)) {
      i++
      continue
    }

    let j = i + 1
    let merged = current

    while (j < sortedPrices.length && sortedPrices[j].store_product_id === current.store_product_id) {
      const next = sortedPrices[j]

      if (!isValidPriceEntry(next)) {
        j++
        continue
      }

      if (arePricePointsEqual(merged, next)) {
        merged = mergePrices(merged, next)
        j++
      } else {
        break
      }
    }

    result.push(merged)
    i = j
  }

  return result
}

export function arePricePointsEqual(p1: Price, p2: Price) {
  if (!p1 || !p2) return false

  return (
    p1.price === p2.price &&
    p1.price_recommended === p2.price_recommended &&
    p1.price_per_major_unit === p2.price_per_major_unit
  )
}

/**
 * Updates the price point for a product using a server-side RPC.
 * All comparison and insert/update logic happens inside Postgres,
 * eliminating the read egress that the old approach required.
 *
 * Falls back to the legacy read-compare-write path if the RPC is
 * not yet deployed (e.g., migration not applied).
 */
export async function updatePricePoint(sp: StoreProduct) {
  if (!sp.id) {
    console.error("No id for product", sp.id)
    return
  }

  if (!sp.price || sp.price <= 0) {
    console.warn("Invalid price point, skipping:", { id: sp.id, price: sp.price })
    return
  }

  const supabase = createClient()
  const timestamp = now()

  const { data, error } = await supabase.rpc("upsert_price_point", {
    p_store_product_id: sp.id,
    p_price: sp.price,
    p_price_recommended: sp.price_recommended,
    p_price_per_major_unit: sp.price_per_major_unit,
    p_discount: sp.discount,
    p_timestamp: timestamp,
  })

  if (error) {
    // RPC might not exist yet — fall back to legacy path
    if (error.message.includes("upsert_price_point") || error.code === "42883") {
      console.warn("[Pricing] RPC not available, falling back to legacy path")
      return updatePricePointLegacy(sp)
    }
    console.error(`[Pricing] RPC error for product ${sp.id}:`, error.message)
    return
  }

  const result = data as { action: string; reason?: string }
  if (result.action === "skipped") {
    console.warn(`[Pricing] Skipped by RPC:`, result.reason)
  } else {
    console.info(`🛜 [Pricing] ${result.action} price for product ${sp.id}`)
  }
}

/**
 * Legacy path: read latest price → compare in JS → write.
 * Kept as fallback while the upsert_price_point RPC is being deployed.
 */
async function updatePricePointLegacy(sp: StoreProduct) {
  const timestamp = now()
  const newPricePoint: Price = {
    store_product_id: sp.id,
    price: sp.price,
    price_recommended: sp.price_recommended,
    price_per_major_unit: sp.price_per_major_unit,
    discount: sp.discount,
    created_at: timestamp,
    valid_from: timestamp,
    valid_to: null,
    updated_at: timestamp,
  }

  const existingPricePoint = await priceQueries.getLatestPricePoint(sp.id)

  if (existingPricePoint && arePricePointsEqual(existingPricePoint, newPricePoint)) {
    await priceQueries.updatePricePointUpdatedAt(existingPricePoint.id)
    await storeProductQueries.touchUpdatedAt(sp.id)
    return
  }

  if (existingPricePoint) {
    const result = await priceQueries.closeExistingPricePoint(existingPricePoint.id, newPricePoint)
    if (!result.success) {
      console.error(`[Pricing] Failed to update price point for product ${sp.id}:`, result.error)
      return
    }
    await storeProductQueries.touchUpdatedAt(sp.id)
    return
  }

  const insertResult = await priceQueries.insertNewPricePoint(newPricePoint)
  if (insertResult.error) {
    console.error(`[Pricing] Failed to insert first price point for product ${sp.id}:`, insertResult.error)
    return
  }
  await storeProductQueries.touchUpdatedAt(sp.id)
}
