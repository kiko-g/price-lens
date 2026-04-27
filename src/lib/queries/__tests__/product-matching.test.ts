import { beforeEach, describe, expect, it, vi } from "vitest"
import { findRelatedProducts } from "../product-matching"
import { createMockStoreProduct, createQueryBuilderMock, setMockResult } from "./mocks/supabase"

const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

describe("findRelatedProducts", () => {
  let fromN = 0

  beforeEach(() => {
    vi.clearAllMocks()
    fromN = 0
    mockRpc.mockReset()
  })

  it("returns a same-lineage brand via % ilike and brandsMatch (e.g. Nescafé Buondi vs Buondi)", async () => {
    const source = createMockStoreProduct({
      id: 1,
      name: "café cápsulas intenso descafeinado",
      brand: "Buondi",
    })
    const sibling = createMockStoreProduct({
      id: 2,
      name: "outro qualquer",
      brand: "Nescafé Buondi",
      category: "Coffee",
    })

    mockFrom.mockImplementation(() => {
      const chain = createQueryBuilderMock()
      const i = fromN++
      if (i === 0) {
        setMockResult(chain, source, null)
        return chain
      }
      if (i === 1) {
        setMockResult(chain, [sibling], null)
        return chain
      }
      setMockResult(chain, [], null)
      return chain
    })

    const { data, error } = await findRelatedProducts("1", 10, null)

    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(1)
    expect(data?.[0].id).toBe(2)
    expect(data?.[0].similarity_factors.some((f) => f === "same_brand")).toBe(true)
  })

  it("skips the looser name round when the fast path already has enough scored matches (latency)", async () => {
    const source = createMockStoreProduct({
      id: 1,
      name: "café cápsulas intenso descafeinado",
      brand: "Buondi",
    })
    const a = createMockStoreProduct({ id: 2, name: "a", brand: "Nescafé Buondi" })
    const b = createMockStoreProduct({ id: 3, name: "b", brand: "Nescafé Buondi" })
    const c = createMockStoreProduct({ id: 4, name: "c", brand: "Nescafé Buondi" })

    mockFrom.mockImplementation(() => {
      const chain = createQueryBuilderMock()
      const i = fromN++
      if (i === 0) {
        setMockResult(chain, source, null)
        return chain
      }
      if (i === 1) {
        setMockResult(chain, [a, b, c], null)
        return chain
      }
      setMockResult(chain, [], null)
      return chain
    })

    const { data, error } = await findRelatedProducts("1", 10, null)

    expect(error).toBeNull()
    expect(data?.length).toBe(3)
    // fast path: from + 2 (brand + name strict) only; no 4th+ from() for looser `textSearch`
    expect(fromN).toBe(3)
  })

  it("falls back to same category with lower min score when primary scoring is empty", async () => {
    const source = createMockStoreProduct({
      id: 10,
      name: "uniquesnowflake",
      brand: "SoloOnlyBrandX",
      category: "Aisle7",
    })
    const categoryNeighbor = createMockStoreProduct({
      id: 11,
      name: "completely different product name",
      brand: "OtherBrand",
      category: "Aisle7",
    })

    mockFrom.mockImplementation(() => {
      const chain = createQueryBuilderMock()
      const i = fromN++
      if (i === 0) {
        setMockResult(chain, source, null)
        return chain
      }
      if (i === 1 || i === 2) {
        setMockResult(chain, [], null)
        return chain
      }
      if (i === 3) {
        setMockResult(chain, [categoryNeighbor], null)
        return chain
      }
      setMockResult(chain, [], null)
      return chain
    })

    const { data, error } = await findRelatedProducts("10", 10, null)

    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(1)
    expect(data?.[0].id).toBe(11)
  })
})
