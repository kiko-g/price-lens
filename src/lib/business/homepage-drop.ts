import { generateProductSlug } from "@/lib/business/product"
import { PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE, priceBeforeFromChangeRatio } from "@/lib/business/price-change"

export type HomepageDrop = {
  id: number
  name: string
  image: string
  href: string
  originId: number
  price: number
  /** Price before the latest change. Absent when the ratio cannot be inverted. */
  priceBefore: number | null
  /** Decimal ratio, e.g. -0.25 for a 25% drop. */
  changeRatio: number
}

export type HomepageDropRow = {
  id: number
  name: string | null
  brand: string | null
  image: string | null
  origin_id: number | null
  price: number | null
  price_change_pct: number | null
}

export function toHomepageDrop(row: HomepageDropRow): HomepageDrop | null {
  if (!row.name || !row.image || row.origin_id == null) return null
  if (row.price == null || row.price <= 0) return null
  const changeRatio = row.price_change_pct
  if (changeRatio == null || changeRatio >= 0 || changeRatio < -PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE) return null

  const priceBefore = priceBeforeFromChangeRatio(row.price, changeRatio)

  return {
    id: row.id,
    name: row.name,
    image: row.image,
    href: `/products/${row.id}-${generateProductSlug(row)}`,
    originId: row.origin_id,
    price: row.price,
    priceBefore: priceBefore != null && priceBefore > row.price ? priceBefore : null,
    changeRatio,
  }
}
