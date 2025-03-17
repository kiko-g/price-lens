import { Product, StoreProduct, Price } from "@/types"

import { now } from "./utils"
import { priceQueries } from "./db/queries/prices"

export function arePricePointsEqual(p1: Price, p2: Price) {
  if (!p1 || !p2) return false

  return (
    p1.price === p2.price &&
    p1.price_recommended === p2.price_recommended &&
    p1.price_per_major_unit === p2.price_per_major_unit
  )
}

export async function updatePricePoint(p: Product, sp: StoreProduct) {
  if (!p.id || !sp.id) {
    console.error("No id for product", p.id, sp.id)
    return
  }

  const timestamp = now()
  const newPricePoint: Price = {
    product_id: p.id,
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

  const existingPricePoint = await priceQueries.getLatestPricePoint(p.id, sp.id)
  if (existingPricePoint && arePricePointsEqual(existingPricePoint, newPricePoint)) {
    console.info("Price point already exists and is up to date.", existingPricePoint)
    await priceQueries.updatePricePointUpdatedAt(existingPricePoint.id)
    return
  }

  if (existingPricePoint) {
    console.info("Price point already exists but is outdated.", existingPricePoint)
    await priceQueries.closeExistingPricePoint(existingPricePoint.id, newPricePoint)
    return
  }

  await priceQueries.insertNewPricePoint(newPricePoint)
}
