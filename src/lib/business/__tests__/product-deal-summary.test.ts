import { describe, expect, it } from "vitest"
import type { PricePoint, StoreProduct } from "@/types"
import { getProductDealSummary } from "@/lib/business/product-deal-summary"

function sp(over: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 1,
    name: "Test",
    price: 13.99,
    price_recommended: 18.49,
    origin_id: 1,
    ...over,
  } as StoreProduct
}

function point(p: Partial<PricePoint> & Pick<PricePoint, "price" | "frequencyRatio">): PricePoint {
  return {
    price_recommended: p.price_recommended ?? 18.49,
    price_per_major_unit: 20,
    discount: 0,
    averageDurationDays: 1,
    totalDuration: 1,
    occurrences: 1,
    ...p,
  }
}

describe("getProductDealSummary", () => {
  it("returns single-price copy", () => {
    const r = getProductDealSummary(
      sp(),
      [point({ price: 13.99, frequencyRatio: 1 })],
      point({ price: 13.99, frequencyRatio: 1 }),
    )
    expect(r?.summaryLine).toContain("Only one price")
    expect(r?.tier).toBe("single")
    expect(r?.tierLabel).toBeNull()
  })

  it("marks habitual when current matches most common by price", () => {
    const low = point({ price: 13.99, price_recommended: 18.49, frequencyRatio: 0.91 })
    const high = point({ price: 18.49, price_recommended: 18.49, frequencyRatio: 0.09 })
    const r = getProductDealSummary(sp({ price: 13.99, price_recommended: 18.49 }), [low, high], low)
    expect(r?.tierLabel).toBe("Usually this price")
    expect(r?.summaryLine).toContain("most common")
  })

  it("marks infrequent tier when current is rare", () => {
    const low = point({ price: 13.99, price_recommended: 18.49, frequencyRatio: 0.91 })
    const high = point({ price: 18.49, price_recommended: 18.49, frequencyRatio: 0.09 })
    const r = getProductDealSummary(sp({ price: 18.49, price_recommended: 18.49 }), [low, high], low)
    expect(r?.tierLabel).toBe("Uncommon right now")
    expect(r?.summaryLine).toContain("the most common is")
  })
})
