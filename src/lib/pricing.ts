import { StoreProduct, Price } from "@/types"

import { now } from "./utils"
import { priceQueries } from "./db/queries/prices"

export function isValidPriceValue(value: number | null): boolean {
  return typeof value === "number" && !isNaN(value)
}

export function isValidPriceEntry(price: Price): boolean {
  return (
    isValidPriceValue(price.price) ||
    isValidPriceValue(price.price_recommended) ||
    isValidPriceValue(price.price_per_major_unit)
  )
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

export async function updatePricePoint(sp: StoreProduct) {
  if (!sp.id) {
    console.error("No id for product", sp.id)
    return
  }

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

  const isInvalidPricePoint = !sp.price || !sp.price_recommended || !sp.price_per_major_unit

  // Skip invalid price data entirely
  if (isInvalidPricePoint) {
    console.warn("Invalid price point, skipping:", { id: sp.id, price: sp.price })
    return
  }

  const existingPricePoint = await priceQueries.getLatestPricePoint(sp.id)

  // Price unchanged - just update the timestamp to show it was checked
  if (existingPricePoint && arePricePointsEqual(existingPricePoint, newPricePoint)) {
    console.info("Price point already exists and is up to date.", existingPricePoint)
    await priceQueries.updatePricePointUpdatedAt(existingPricePoint.id)
    return
  }

  // Price changed - close old price point and insert new one
  if (existingPricePoint) {
    console.info("Price point already exists but is outdated.", existingPricePoint)
    await priceQueries.closeExistingPricePoint(existingPricePoint.id, newPricePoint)
    return
  }

  // First price point for this product
  await priceQueries.insertNewPricePoint(newPricePoint)
}
