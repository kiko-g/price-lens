/**
 * Open Food Facts barcode lookup and brand search.
 *
 * Rate limits:
 *  - 100 GET /product requests per minute (product reads + taxonomy pages)
 *  - 10 GET /cgi/search.pl per minute (search endpoint — we avoid this)
 *
 * We enforce a minimum delay between calls to stay well within the limit.
 */

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product"
const OFF_BRAND_BASE = "https://world.openfoodfacts.org/brand"
const USER_AGENT = "PriceLens/1.0 (https://price-lens.vercel.app; contact@price-lens.vercel.app)"
const MIN_DELAY_MS = 650 // ~92 req/min, safely under the 100/min limit
const THROTTLE_STALE_MS = 10_000 // skip throttle if last request was >10s ago
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1_500

const PRODUCT_FIELDS = [
  "code",
  "product_name",
  "generic_name",
  "brands",
  "quantity",
  "categories",
  "categories_tags",
  "image_front_url",
  "image_front_small_url",
  "nutriscore_grade",
  "nova_group",
  "ecoscore_grade",
  "nutriments",
  "nutrient_levels",
  "serving_size",
  "labels",
  "ingredients_text",
  "allergens",
  "image_nutrition_url",
  "image_ingredients_url",
  "completeness",
  "packaging_text",
].join(",")

let lastRequestAt = 0

export interface OffNutriments {
  energyKcal100g: number | null
  energyKj100g: number | null
  fat100g: number | null
  saturatedFat100g: number | null
  carbohydrates100g: number | null
  sugars100g: number | null
  fiber100g: number | null
  proteins100g: number | null
  salt100g: number | null
}

export interface OffProduct {
  /** Raw product_name from OFF (can be incomplete, e.g. "Strawberry") */
  productName: string | null
  /** First brand + product_name combined (e.g. "Milka Strawberry") */
  displayName: string | null
  /** Clean generic description (e.g. "Puré de fruta") */
  genericName: string | null
  brands: string | null
  quantity: string | null
  categories: string | null
  /** Structured category tags (e.g. ["en:dairies", "en:yogurts"]) */
  categoriesTags: string[] | null
  /** 400px front image */
  imageUrl: string | null
  /** 200px front image (for cards/thumbnails) */
  imageSmallUrl: string | null
  nutriscoreGrade: string | null
  /** NOVA food processing classification (1-4) */
  novaGroup: number | null
  /** Environmental impact grade (a-e) */
  ecoscoreGrade: string | null
  nutriments: OffNutriments | null
  /** Traffic light levels: { fat: "low", sugars: "high", ... } */
  nutrientLevels: Record<string, string> | null
  servingSize: string | null
  labels: string | null
  ingredientsText: string | null
  allergens: string | null
  /** Photo of the nutrition label */
  imageNutritionUrl: string | null
  /** Photo of the ingredients label */
  imageIngredientsUrl: string | null
  /** Data quality score (0-1) */
  completeness: number | null
  /** Packaging description */
  packagingText: string | null
  /** EAN/barcode — present when returned from brand search */
  barcode: string | null
}

async function throttle(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (lastRequestAt > 0 && elapsed < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed))
  }
  lastRequestAt = Date.now()
}

/**
 * Throttle variant that skips the delay if the last request was long ago.
 * Used for interactive paths where the first request shouldn't be penalized.
 */
async function throttleInteractive(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestAt
  if (lastRequestAt > 0 && elapsed < THROTTLE_STALE_MS && elapsed < MIN_DELAY_MS) {
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

function parseNutriments(raw: any): OffNutriments | null {
  if (!raw || typeof raw !== "object") return null
  const n: OffNutriments = {
    energyKcal100g: typeof raw["energy-kcal_100g"] === "number" ? raw["energy-kcal_100g"] : null,
    energyKj100g: typeof raw["energy_100g"] === "number" ? raw["energy_100g"] : null,
    fat100g: typeof raw.fat_100g === "number" ? raw.fat_100g : null,
    saturatedFat100g: typeof raw["saturated-fat_100g"] === "number" ? raw["saturated-fat_100g"] : null,
    carbohydrates100g: typeof raw.carbohydrates_100g === "number" ? raw.carbohydrates_100g : null,
    sugars100g: typeof raw.sugars_100g === "number" ? raw.sugars_100g : null,
    fiber100g: typeof raw.fiber_100g === "number" ? raw.fiber_100g : null,
    proteins100g: typeof raw.proteins_100g === "number" ? raw.proteins_100g : null,
    salt100g: typeof raw.salt_100g === "number" ? raw.salt_100g : null,
  }
  const hasAny = Object.values(n).some((v) => v !== null)
  return hasAny ? n : null
}

function parseNutrientLevels(raw: any): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null
  const valid = ["low", "moderate", "high"]
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === "string" && valid.includes(val)) {
      result[key] = val
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

function parseOffProduct(p: any, barcodeOverride?: string): OffProduct | null {
  const rawName: string | null = p.product_name || null
  const rawBrands: string | null = p.brands || null

  if (!rawName) return null

  let displayName: string | null = null
  const primaryBrand = rawBrands?.split(",")[0]?.trim()
  if (primaryBrand && !rawName.toLowerCase().startsWith(primaryBrand.toLowerCase())) {
    displayName = `${primaryBrand} ${rawName}`
  } else {
    displayName = rawName
  }

  const novaGroup = typeof p.nova_group === "number" ? p.nova_group : null

  return {
    productName: rawName,
    displayName,
    genericName: p.generic_name || null,
    brands: rawBrands,
    quantity: p.quantity || null,
    categories: p.categories || null,
    categoriesTags: Array.isArray(p.categories_tags) ? p.categories_tags : null,
    imageUrl: p.image_front_url || p.image_front_small_url || null,
    imageSmallUrl: p.image_front_small_url || null,
    nutriscoreGrade: p.nutriscore_grade || null,
    novaGroup,
    ecoscoreGrade: p.ecoscore_grade || null,
    nutriments: parseNutriments(p.nutriments),
    nutrientLevels: parseNutrientLevels(p.nutrient_levels),
    servingSize: p.serving_size || null,
    labels: p.labels || null,
    ingredientsText: p.ingredients_text || null,
    allergens: p.allergens || null,
    imageNutritionUrl: p.image_nutrition_url || null,
    imageIngredientsUrl: p.image_ingredients_url || null,
    completeness: typeof p.completeness === "number" ? p.completeness : null,
    packagingText: p.packaging_text || null,
    barcode: barcodeOverride || p.code || null,
  }
}

/**
 * Look up a barcode in Open Food Facts with retry on transient failures.
 * HTTP 404 is treated as "not found" (OFF uses 404 for unknown barcodes).
 * Uses interactive throttle: skips delay if no recent requests (first scan is instant).
 */
export async function lookupBarcode(
  barcode: string,
  { maxRetries = MAX_RETRIES }: { maxRetries?: number } = {},
): Promise<LookupResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttleInteractive()

    try {
      const res = await fetch(`${OFF_API_BASE}/${barcode}.json?fields=${PRODUCT_FIELDS}`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15_000),
        next: { revalidate: 86_400 },
      })

      if (res.status === 404) {
        return { status: "not_found" }
      }

      if (!res.ok) {
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

      const product = parseOffProduct(json.product, barcode)
      if (!product) {
        return { status: "not_found" }
      }

      return { status: "found", product }
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
 * Fetch products from the same brand via OFF's taxonomy page.
 * Uses 24h caching. Excludes a specific barcode (the current product).
 */
export async function searchOffByBrand(
  brand: string,
  excludeBarcode?: string,
  { limit = 8 }: { limit?: number } = {},
): Promise<OffProduct[]> {
  await throttle()

  try {
    const encoded = encodeURIComponent(brand.toLowerCase().replace(/\s+/g, "-"))
    const res = await fetch(`${OFF_BRAND_BASE}/${encoded}.json?fields=${PRODUCT_FIELDS}&page_size=20`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 86_400 },
    })

    if (!res.ok) return []

    const json = await res.json()
    if (!json.products || !Array.isArray(json.products)) return []

    const products: OffProduct[] = []
    for (const raw of json.products) {
      if (excludeBarcode && raw.code === excludeBarcode) continue
      const parsed = parseOffProduct(raw)
      if (parsed?.imageSmallUrl) {
        products.push(parsed)
      }
      if (products.length >= limit) break
    }

    return products
  } catch {
    return []
  }
}

/**
 * Convenience wrapper that returns OffProduct | null (used by Live OFF Lookup API).
 */
export async function lookupBarcodeSimple(barcode: string): Promise<OffProduct | null> {
  const result = await lookupBarcode(barcode)
  return result.status === "found" ? result.product : null
}
