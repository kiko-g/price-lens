import { describe, expect, it } from "vitest"

import { toHomepageDrop, type HomepageDropRow } from "@/lib/business/homepage-drop"

function row(over: Partial<HomepageDropRow> = {}): HomepageDropRow {
  return {
    id: 42,
    name: "Leite Mimosa",
    brand: "Mimosa",
    image: "https://example.com/leite.jpg",
    origin_id: 1,
    price: 0.75,
    price_change_pct: -0.25,
    ...over,
  }
}

describe("toHomepageDrop", () => {
  it("keeps a plausible drop and the price before it", () => {
    const drop = toHomepageDrop(row())
    expect(drop).toMatchObject({
      id: 42,
      name: "Leite Mimosa",
      originId: 1,
      price: 0.75,
      changeRatio: -0.25,
      href: "/products/42-mimosa-leite-mimosa-1",
    })
    expect(drop?.priceBefore).toBeCloseTo(1)
  })

  it("drops rows that are not a real price decrease", () => {
    expect(toHomepageDrop(row({ price_change_pct: 0 }))).toBeNull()
    expect(toHomepageDrop(row({ price_change_pct: -0.9 }))).toBeNull()
    expect(toHomepageDrop(row({ image: null }))).toBeNull()
    expect(toHomepageDrop(row({ price: 0 }))).toBeNull()
  })
})
