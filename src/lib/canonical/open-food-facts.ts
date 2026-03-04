/**
 * Open Food Facts barcode lookup.
 *
 * Rate limit: 100 GET /product requests per minute.
 * We enforce a minimum delay between calls to stay well within that.
 */

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product"
const USER_AGENT = "PriceLens/1.0 (https://pricelens.pt; contact@pricelens.pt)"
const MIN_DELAY_MS = 650 // ~92 req/min, safely under the 100/min limit
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 3_000

let lastRequestAt = 0

export interface OffProduct {
  /** Raw product_name from OFF (can be incomplete, e.g. "Strawberry") */
  productName: string | null
  /** First brand + product_name combined (e.g. "Milka Strawberry") */
  displayName: string | null
  brands: string | null
  quantity: string | null
  categories: string | null
  imageUrl: string | null
}

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed))
  }
  lastRequestAt = Date.now()
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export type LookupResult =
  | { status: "found"; product: OffProduct }
  | { status: "not_found" }
  | { status: "error"; reason: string }

/**
 * Look up a barcode in Open Food Facts with retry on transient failures.
 * HTTP 404 is treated as "not found" (OFF uses 404 for unknown barcodes).
 */
export async function lookupBarcode(
  barcode: string,
  { maxRetries = MAX_RETRIES }: { maxRetries?: number } = {},
): Promise<LookupResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle()

    try {
      const res = await fetch(
        `${OFF_API_BASE}/${barcode}.json?fields=product_name,brands,quantity,categories,image_front_small_url`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(15_000),
          next: { revalidate: 86_400 },
        },
      )

      // OFF returns 404 for unknown barcodes — that's a genuine "not found"
      if (res.status === 404) {
        return { status: "not_found" }
      }

      if (!res.ok) {
        // 429 / 5xx → transient, retry
        if (attempt < maxRetries) {
          const backoff = RETRY_DELAY_MS * (attempt + 1)
          await sleep(backoff)
          continue
        }
        return { status: "error", reason: `HTTP ${res.status}` }
      }

      const json = await res.json()
      if (json.status !== 1 || !json.product) {
        return { status: "not_found" }
      }

      const p = json.product
      const rawName: string | null = p.product_name || null
      const rawBrands: string | null = p.brands || null

      if (!rawName) {
        return { status: "not_found" }
      }

      let displayName: string | null = null
      const primaryBrand = rawBrands?.split(",")[0]?.trim()
      if (primaryBrand && !rawName.toLowerCase().startsWith(primaryBrand.toLowerCase())) {
        displayName = `${primaryBrand} ${rawName}`
      } else {
        displayName = rawName
      }

      return {
        status: "found",
        product: {
          productName: rawName,
          displayName,
          brands: rawBrands,
          quantity: p.quantity || null,
          categories: p.categories || null,
          imageUrl: p.image_front_small_url || null,
        },
      }
    } catch (err) {
      if (attempt < maxRetries) {
        const backoff = RETRY_DELAY_MS * (attempt + 1)
        await sleep(backoff)
        continue
      }
      const reason = err instanceof Error ? err.message : "unknown"
      return { status: "error", reason }
    }
  }

  return { status: "error", reason: "max retries exceeded" }
}

/**
 * Convenience wrapper that returns OffProduct | null (used by Live OFF Lookup API).
 */
export async function lookupBarcodeSimple(barcode: string): Promise<OffProduct | null> {
  const result = await lookupBarcode(barcode)
  return result.status === "found" ? result.product : null
}
