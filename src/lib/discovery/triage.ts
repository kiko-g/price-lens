import { createAdminClient } from "@/lib/supabase/server"
import { getScraper } from "@/lib/scrapers"
import { getStoreConfig, getCategoryCrawlConfig } from "@/lib/discovery/stores"
import { now } from "@/lib/utils"

const TRIAGE_BATCH_SIZE = 50
const AUDIT_PAGE_SIZE = 900
const DELAY_BETWEEN_SCRAPES_MS = 500

export interface TriageResult {
  processed: number
  kept: number
  vetoed: number
  parked: number
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

export interface AuditOptions {
  verbose?: boolean
  dryRun?: boolean
  originId?: number
  /** 'parked' = only priority_source='unmapped'; 'full' = all products with category data */
  scope?: "parked" | "full"
  /** When true, overrides ALL priorities including manual. Use for a clean-slate reset. */
  force?: boolean
}

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

  await supabase.from("prices").delete().eq("store_product_id", productId)
  await supabase.from("user_favorites").delete().eq("store_product_id", productId)

  const { error: deleteError } = await supabase.from("store_products").delete().eq("id", productId)

  if (deleteError) {
    return { error: `Product delete failed: ${deleteError.message}` }
  }

  return { error: null }
}

async function deleteProduct(supabase: ReturnType<typeof createAdminClient>, productId: number) {
  await supabase.from("prices").delete().eq("store_product_id", productId)
  await supabase.from("user_favorites").delete().eq("store_product_id", productId)
  await supabase.from("store_products").delete().eq("id", productId)
}

/**
 * Parks a product with unmapped category: sets priority=0 and priority_source='unmapped'.
 * The product stays in store_products so it can be re-evaluated when mappings are added.
 */
async function parkProduct(
  supabase: ReturnType<typeof createAdminClient>,
  productId: number,
  scrapedData?: {
    name: string
    brand: string | null
    barcode: string | null
    pack: string | null
    price: number
    price_recommended: number | null
    price_per_major_unit: number | null
    major_unit: string | null
    image: string | null
    category: string | null
    category_2: string | null
    category_3: string | null
    discount: number | null
    available: boolean
  },
): Promise<{ error: string | null }> {
  const updateData: Record<string, unknown> = {
    priority: 0,
    priority_source: "unmapped",
    priority_updated_at: now(),
  }

  if (scrapedData) {
    Object.assign(updateData, {
      name: scrapedData.name,
      brand: scrapedData.brand,
      barcode: scrapedData.barcode,
      pack: scrapedData.pack,
      price: scrapedData.price,
      price_recommended: scrapedData.price_recommended,
      price_per_major_unit: scrapedData.price_per_major_unit,
      major_unit: scrapedData.major_unit,
      image: scrapedData.image,
      category: scrapedData.category,
      category_2: scrapedData.category_2,
      category_3: scrapedData.category_3,
      discount: scrapedData.discount,
      available: scrapedData.available ?? true,
      scraped_at: now(),
    })
  }

  const { error } = await supabase.from("store_products").update(updateData).eq("id", productId)

  if (error) {
    return { error: `Park failed: ${error.message}` }
  }
  return { error: null }
}

/**
 * Runs triage on untriaged store_products (priority IS NULL, name IS NULL).
 * For each product:
 * 1. Scrapes to get name + categories
 * 2. Resolves category governance
 * 3. Unmapped category → park (priority=0, source='unmapped')
 * 4. Untracked category → veto (delete + record SKU)
 * 5. Tracked category → keep with default priority
 */
export async function runTriage(options: TriageOptions = {}): Promise<TriageResult> {
  const startTime = Date.now()
  const batchSize = options.batchSize ?? TRIAGE_BATCH_SIZE
  const verbose = options.verbose ?? false

  const result: TriageResult = {
    processed: 0,
    kept: 0,
    vetoed: 0,
    parked: 0,
    errors: 0,
    notFound: 0,
    unmappedCategories: [],
    durationMs: 0,
  }

  const supabase = createAdminClient()

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
      const sitemapConfig = getStoreConfig(originId)
      const crawlConfig = getCategoryCrawlConfig(originId)
      const scraper = getScraper(originId)
      const skuExtractor = sitemapConfig?.skuExtractor ?? crawlConfig?.skuExtractor ?? null
      const sku = skuExtractor?.(url) ?? null

      if (verbose) {
        console.log(`[Triage] Scraping ${url}`)
      }

      const scrapeResult = await scraper.scrape({ url, useAntiBlock: true })

      if (scrapeResult.type === "not_found") {
        if (sku) {
          if (!options.dryRun) {
            await vetoProduct(productId, originId, sku, null)
          }
          result.vetoed++
        } else {
          if (!options.dryRun) {
            await deleteProduct(supabase, productId)
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

      const governance = await resolveGovernance(originId, category, category2, category3)

      if (!governance) {
        // No category mapping exists — park the product instead of vetoing
        result.unmappedCategories.push({
          originId,
          category: category ?? "NULL",
          category2,
          category3,
        })

        if (verbose) {
          console.log(`[Triage] Parking (unmapped: ${category}): ${scraped.name ?? url}`)
        }

        if (!options.dryRun) {
          await parkProduct(supabase, productId, {
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
          })
        }
        result.parked++
        result.processed++
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      if (!governance.tracked) {
        if (verbose) {
          console.log(`[Triage] Vetoing (untracked: ${category}): ${scraped.name ?? url}`)
        }
        if (sku) {
          if (!options.dryRun) {
            await vetoProduct(productId, originId, sku, category)
          }
        } else {
          if (!options.dryRun) {
            await deleteProduct(supabase, productId)
          }
        }
        result.vetoed++
        result.processed++
        await delay(DELAY_BETWEEN_SCRAPES_MS)
        continue
      }

      // Tracked category — keep with default priority
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
      `[Triage] Done: ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked, ${result.errors} errors, ${result.notFound} not found`,
    )
    if (result.unmappedCategories.length > 0) {
      const unique = dedupeUnmapped(result.unmappedCategories)
      console.log(`[Triage] Unmapped categories (${unique.length}):`, JSON.stringify(unique))
    }
  }

  return result
}

type GovernanceResult = { tracked: boolean; defaultPriority: number; canonicalCategoryId: number } | null

/**
 * Cached governance resolver — avoids redundant RPC calls for the same category tuple.
 * Category tuples repeat heavily across products (e.g. thousands of "Mercearia > Bolachas").
 */
function createGovernanceCache() {
  const cache = new Map<string, GovernanceResult>()

  return async function resolve(
    originId: number,
    category: string | null,
    category2: string | null,
    category3: string | null,
  ): Promise<GovernanceResult> {
    if (!category) return null
    const key = `${originId}:${category}:${category2 ?? ""}:${category3 ?? ""}`
    if (cache.has(key)) return cache.get(key)!

    const result = await resolveGovernance(originId, category, category2, category3)
    cache.set(key, result)
    return result
  }
}

/**
 * Governance audit: re-evaluates already-scraped products against current category mappings.
 * No HTTP scraping — uses existing category/name data in store_products.
 *
 * Paginates through ALL matching products using cursor-based pagination (id > lastId)
 * to avoid the Supabase 1000-row limit. Uses a governance cache to minimize RPC calls.
 *
 * Scopes:
 * - 'parked': only products with priority_source='unmapped' (default)
 * - 'full': ALL products with category data — re-evaluates everything including
 *   products set by AI or manual priority. Use after completing category mappings
 *   to veto products in untracked categories across the entire catalog.
 *
 * For each product:
 * - Mapped + tracked → assign category default priority (only overrides if priority_source != 'manual')
 * - Mapped + untracked → veto
 * - Unmapped → park (priority=0, source='unmapped')
 */
export async function runGovernanceAudit(options: AuditOptions = {}): Promise<TriageResult> {
  const startTime = Date.now()
  const verbose = options.verbose ?? false
  const scope = options.scope ?? "parked"

  const result: TriageResult = {
    processed: 0,
    kept: 0,
    vetoed: 0,
    parked: 0,
    errors: 0,
    notFound: 0,
    unmappedCategories: [],
    durationMs: 0,
  }

  const supabase = createAdminClient()
  const cachedResolve = createGovernanceCache()
  let lastId = 0
  let batchNum = 0

  while (true) {
    let query = supabase
      .from("store_products")
      .select("id, url, origin_id, category, category_2, category_3, name, priority_source")
      .not("category", "is", null)
      .not("origin_id", "is", null)
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(AUDIT_PAGE_SIZE)

    if (scope === "parked") {
      query = query.eq("priority_source", "unmapped")
    } else {
      query = query.not("name", "is", null)
    }

    if (options.originId) {
      query = query.eq("origin_id", options.originId)
    }

    const { data: products, error: fetchError } = await query

    if (fetchError) {
      console.error("[Audit] Failed to fetch products:", fetchError.message)
      break
    }

    if (!products || products.length === 0) break

    batchNum++
    if (verbose) {
      console.log(`[Audit] Batch ${batchNum}: processing ${products.length} products (id > ${lastId})`)
    }

    for (const product of products) {
      const originId = product.origin_id as number
      const productId = product.id as number
      const url = product.url as string
      const category = product.category as string
      const category2 = (product.category_2 as string) ?? null
      const category3 = (product.category_3 as string) ?? null
      const currentSource = product.priority_source as string | null

      try {
        const governance = await cachedResolve(originId, category, category2, category3)

        if (!governance) {
          result.unmappedCategories.push({ originId, category, category2, category3 })

          if (currentSource !== "unmapped") {
            if (!options.dryRun) {
              await supabase
                .from("store_products")
                .update({ priority: 0, priority_source: "unmapped", priority_updated_at: now() })
                .eq("id", productId)
            }
          }
          result.parked++
          result.processed++
          continue
        }

        if (!governance.tracked) {
          const sitemapConfig = getStoreConfig(originId)
          const crawlConfig = getCategoryCrawlConfig(originId)
          const skuExtractor = sitemapConfig?.skuExtractor ?? crawlConfig?.skuExtractor ?? null
          const sku = skuExtractor?.(url) ?? null

          if (sku) {
            if (!options.dryRun) {
              await vetoProduct(productId, originId, sku, category)
            }
          } else {
            if (!options.dryRun) {
              await deleteProduct(supabase, productId)
            }
          }
          result.vetoed++
          result.processed++
          continue
        }

        // Mapped + tracked — respect manual overrides unless force is set
        if (!options.force && scope === "full" && currentSource === "manual") {
          result.kept++
          result.processed++
          continue
        }

        if (!options.dryRun) {
          const { error: updateError } = await supabase
            .from("store_products")
            .update({
              priority: governance.defaultPriority,
              priority_source: "category_default" as const,
              priority_updated_at: now(),
            })
            .eq("id", productId)

          if (updateError) {
            console.error(`[Audit] Update failed for ${productId}:`, updateError.message)
            result.errors++
            result.processed++
            continue
          }
        }

        result.kept++
        result.processed++
      } catch (err) {
        console.error(`[Audit] Error processing product ${productId}:`, err)
        result.errors++
        result.processed++
      }
    }

    lastId = products[products.length - 1].id as number

    if (verbose) {
      console.log(
        `[Audit] Progress: ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked`,
      )
    }

    if (products.length < AUDIT_PAGE_SIZE) break
  }

  result.durationMs = Date.now() - startTime

  if (verbose) {
    console.log(
      `[Audit] Done (scope=${scope}): ${result.processed} processed, ${result.kept} kept, ${result.vetoed} vetoed, ${result.parked} parked, ${result.errors} errors`,
    )
    if (result.unmappedCategories.length > 0) {
      const unique = dedupeUnmapped(result.unmappedCategories)
      console.log(`[Audit] Unmapped (${unique.length}):`, JSON.stringify(unique))
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
