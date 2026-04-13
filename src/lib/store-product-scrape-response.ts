import type { StoreProduct } from "@/types"

export type ScrapeStoreProductApiBody = {
  data?: Partial<StoreProduct> | null
  message?: string
  available?: boolean
}

export function mergeStoreProductScrapeResponse(
  storeProduct: StoreProduct,
  body: unknown,
): StoreProduct {
  const parsed = body as ScrapeStoreProductApiBody
  const scraped = parsed.data
  return {
    ...storeProduct,
    ...scraped,
    id: scraped?.id ?? storeProduct.id,
  } as StoreProduct
}
