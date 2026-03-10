import { createAdminClient } from "@/lib/supabase/server"
import { getScraper } from "@/lib/scrapers"
import { getStoreConfig } from "@/lib/discovery/stores"
import { now } from "@/lib/utils"

const TRIAGE_BATCH_SIZE = 50
const DELAY_BETWEEN_SCRAPES_MS = 500

export interface TriageResult {
  processed: number
  kept: number
  vetoed: number
  errors: number
  notFound: number
  unmappedCategories: { originId: number; category: string; category2: string | null; category3: string | null }[]
  durationMs: number
}

export interface TriageOptions {
  batchSize?: number
  verbose?: boolean
  dryRun?: boolean
}

/**
 * Looks up the canonical category governance for a store category tuple.
 * Returns { tracked, defaultPriority } or null if no mapping exists.
 */
async function resolveGovernance(
  originId: number,
  category: string | null,
  category2: string | null,
  category3: string | null,
): Promise<{ tracked: boolean; defaultPriority: number; canonicalCategoryId: number } | null> {
  if (!category) return null

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc("resolve_category_governance", {
    p_origin_id: originId,
    p_category: category,
    p_category_2: category2 ?? null,
    p_category_3: category3 ?? null,
  })

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  return {
    tracked: row.tracked,
    defaultPriority: row.default_priority,
    canonicalCategoryId: row.canonical_category_id,
  }
}

/**
 * Adds a SKU to the veto list and deletes the store_product + dependents.
 */
async function vetoProduct(
  productId: number,
  originId: number,
  sku: string,
  storeCategory: string | null,
): Promise<{ error: string | null }> {
  const supabase = createAdminClient()

  const { error: vetoError } = await supabase.from("vetoed_store_skus").upsert(
    {
      origin_id: originId,
      sku,
      store_category: storeCategory,
      vetoed_at: now(),
    },
    { onConflict: "origin_id,sku" },
  )

  if (vetoError) {
    return { error: `Veto insert failed: ${vetoError.message}` }
  }

  // Delete dependents first (no CASCADE on these FKs)
  await supabase.from("prices").delete().eq("store_product_id", productId)
  await supabase.from("user_favorites").delete().eq("store_product_id", productId)

  const { error: deleteError } = await supabase.from("store_products").delete().eq("id", productId)

  if (deleteError) {
    return { error: `Product delete failed: ${deleteError.message}` }
  }

  return { error: null }
}

/**
 * Runs triage on untriaged store_products (priority IS NULL, name IS NULL).
 * For each product:
 * 1. Scrapes to get name + categories
 * 2. Resolves category governance
 * 3. Either vetos (deletes + records SKU) or assigns default priority
 */
export async function runTriage(options: TriageOptions = {}): Promise<TriageResult> {
  const startTime = Date.now()
  const batchSize = options.batchSize ?? TRIAGE_BATCH_SIZE
  const verbose = options.verbose ?? false

  const result: TriageResult = {
    processed: 0,
    kept: 0,
    vetoed: 0,
    errors: 0,
    notFound: 0,
    unmappedCategories: [],
    durationMs: 0,
  }

  const supabase = createAdminClient()

  // Fetch untriaged products: priority IS NULL and never scraped (name IS NULL)
  const { data: products, error: fetchError } = await supabase
    .from("store_products")
    .select("id, url, origin_id")
    .is("priority", null)
    .is("name", null)
    .not("url", "is", null)
    .not("origin_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(batchSize)

  if (fetchError) {
    console.error("[Triage] Failed to fetch untriaged products:", fetchError.message)
    result.durationMs = Date.now() - startTime
    return result
  }

  if (!products || products.length === 0) {
    if (verbose) console.log("[Triage] No untriaged products found")
    result.durationMs = Date.now() - startTime
    return result
  }

  if (verbose) {
    console.log(`[Triage] Processing ${products.length} untriaged products`)
  }

  for (const product of products) {
    const url = product.url as string
    const originId = product.origin_id as number
    const productId = product.id as number

    try {
      const config = getStoreConfig(originId)
      const scraper = getScraper(originId)
      const sku = config?.skuExtractor(url) ?? null

      if (verbose) {
        console.log(`[Triage] Scraping ${url}`)
      }

      const scrapeResult = await scraper.scrape({ url, useAntiBlock: true })

      if (scrapeResult.type === "not_found") {
        // Product doesn't exist - veto it if we have a SKU
        if (sku && config) {
          if (!options.dryRun) {
            await vetoProduct(productId, originId, sku, null)
          }
          result.vetoed++
        } else {
          // No SKU to veto - just delete the broken row
          if (!options.dryRun) {
            await supabase.from("prices").delete().eq("store_product_id", productId)
            await supabase.from("user_favorites").delete().eq("store_product_id", productId)
            await supabase.from("store_products").delete().eq("id", productId)
          }
          result.notFound++
        }
        result.processed++
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      if (scrapeResult.type === "error" || !scrapeResult.product) {
        result.errors++
        result.processed++
        // Mark scraped_at so we don't retry too aggressively
        if (!options.dryRun) {
          await supabase.from("store_products").update({ scraped_at: now() }).eq("id", productId)
        }
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      const scraped = scrapeResult.product
      const category = scraped.category ?? null
      const category2 = scraped.category_2 ?? null
      const category3 = scraped.category_3 ?? null

      // Resolve governance: is this product in a tracked category?
      const governance = await resolveGovernance(originId, category, category2, category3)

      if (!governance) {
        // No category mapping exists - veto (default to exclude for unmapped)
        result.unmappedCategories.push({
          originId,
          category: category ?? "NULL",
          category2,
          category3,
        })

        if (sku && config) {
          if (verbose) {
            console.log(`[Triage] Vetoing (unmapped category: ${category}): ${url}`)
          }
          if (!options.dryRun) {
            await vetoProduct(productId, originId, sku, category)
          }
          result.vetoed++
        } else {
          if (!options.dryRun) {
            await supabase.from("prices").delete().eq("store_product_id", productId)
            await supabase.from("user_favorites").delete().eq("store_product_id", productId)
            await supabase.from("store_products").delete().eq("id", productId)
          }
          result.vetoed++
        }
        result.processed++
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      if (!governance.tracked) {
        // Category is untracked - veto
        if (verbose) {
          console.log(`[Triage] Vetoing (untracked category: ${category}): ${url}`)
        }
        if (sku && config) {
          if (!options.dryRun) {
            await vetoProduct(productId, originId, sku, category)
          }
        } else {
          if (!options.dryRun) {
            await supabase.from("prices").delete().eq("store_product_id", productId)
            await supabase.from("user_favorites").delete().eq("store_product_id", productId)
            await supabase.from("store_products").delete().eq("id", productId)
          }
        }
        result.vetoed++
        result.processed++
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      // Category is tracked - update the product with scraped data + assign default priority
      if (verbose) {
        console.log(`[Triage] Keeping (P${governance.defaultPriority}, ${category}): ${scraped.name}`)
      }

      if (!options.dryRun) {
        const { error: updateError } = await supabase
          .from("store_products")
          .update({
            name: scraped.name,
            brand: scraped.brand,
            barcode: scraped.barcode,
            pack: scraped.pack,
            price: scraped.price,
            price_recommended: scraped.price_recommended,
            price_per_major_unit: scraped.price_per_major_unit,
            major_unit: scraped.major_unit,
            image: scraped.image,
            category: scraped.category,
            category_2: scraped.category_2,
            category_3: scraped.category_3,
            discount: scraped.discount,
            available: scraped.available ?? true,
            priority: governance.defaultPriority,
            priority_source: "category_default" as const,
            priority_updated_at: now(),
            scraped_at: now(),
          })
          .eq("id", productId)

        if (updateError) {
          console.error(`[Triage] Update failed for ${productId}:`, updateError.message)
          result.errors++
          result.processed++
          continue
        }
      }

      result.kept++
      result.processed++
    } catch (err) {
      console.error(`[Triage] Error processing product ${productId}:`, err)
      result.errors++
      result.processed++
    }

    await delay(DELAY_BETWEEN_SCRAPES_MS)
  }

  result.durationMs = Date.now() - startTime

  if (verbose) {
    console.log(
      `[Triage] Done: ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.errors} errors, ${result.notFound} not found`,
    )
    if (result.unmappedCategories.length > 0) {
      const unique = dedupeUnmapped(result.unmappedCategories)
      console.log(`[Triage] Unmapped categories (${unique.length}):`, JSON.stringify(unique))
    }
  }

  return result
}

function dedupeUnmapped(items: TriageResult["unmappedCategories"]): TriageResult["unmappedCategories"] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.originId}:${item.category}:${item.category2}:${item.category3}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
