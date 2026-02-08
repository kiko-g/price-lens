import { createAdminClient } from "@/lib/supabase/server"
import { fetchAll } from "@/lib/supabase/fetch-all"
import type { DiscoveryResult, DiscoveryOptions, StoreDiscoveryConfig, DiscoveryRun } from "./types"
import { fetchProductUrlsFromSitemaps } from "./sitemap"
import { getStoreConfig, getAllStoreConfigs } from "./stores"
import { now } from "@/lib/utils"

export type { DiscoveryResult, DiscoveryOptions, StoreDiscoveryConfig }
export { getStoreConfig, getAllStoreConfigs }

const BATCH_SIZE = 500

/**
 * Fetches all existing SKUs for a store from the database
 */
async function fetchAllExistingSkus(
  originId: number,
  skuExtractor: (url: string) => string | null,
  verbose?: boolean,
): Promise<Set<string>> {
  const supabase = createAdminClient()

  const { data, error } = await fetchAll(() =>
    supabase
      .from("store_products")
      .select("url")
      .eq("origin_id", originId)
      .not("url", "is", null)
      .order("id", { ascending: true }),
  )

  if (error) {
    console.error(`[Discovery] Error fetching existing products:`, error.message)
    return new Set<string>()
  }

  const existingSkus = new Set<string>()
  for (const p of data) {
    if (p.url) {
      const sku = skuExtractor(p.url as string)
      if (sku) {
        existingSkus.add(sku)
      }
    }
  }

  if (verbose) {
    console.log(`[Discovery] Loaded ${existingSkus.size} existing SKUs (complete)`)
  }

  return existingSkus
}

/**
 * Runs sitemap discovery for a specific store
 * Uses SKU-based comparison for accurate deduplication
 */
export async function runSitemapDiscovery(originId: number, options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
  const startTime = Date.now()
  const config = getStoreConfig(originId)

  if (!config) {
    return {
      originId,
      originName: "Unknown",
      source: "sitemap",
      urlsFound: 0,
      urlsNew: 0,
      urlsExisting: 0,
      urlsInvalid: 0,
      errors: [`No discovery config for origin ${originId}`],
      durationMs: Date.now() - startTime,
      sampleNewUrls: [],
    }
  }

  const errors: string[] = []
  let urlsFound = 0
  let urlsNew = 0
  let urlsExisting = 0
  let urlsInvalid = 0
  const newUrls: string[] = []

  try {
    // Step 1: Fetch all existing SKUs from database
    if (options.verbose) {
      console.log(`[Discovery] Starting sitemap discovery for ${config.name}`)
      console.log(`[Discovery] Loading existing products from database...`)
    }

    const existingSkus = await fetchAllExistingSkus(config.originId, config.skuExtractor, options.verbose)

    if (options.verbose) {
      console.log(`[Discovery] Found ${existingSkus.size} existing SKUs in database`)
    }

    // Step 2: Fetch all product URLs from sitemaps
    if (options.verbose) {
      console.log(`[Discovery] Fetching sitemap URLs...`)
    }

    const sitemapResult = await fetchProductUrlsFromSitemaps(config.sitemapIndexUrl, config.productSitemapPatterns, {
      verbose: options.verbose,
    })

    errors.push(...sitemapResult.errors)
    urlsFound = sitemapResult.urls.length

    if (options.verbose) {
      console.log(`[Discovery] Found ${urlsFound} URLs from ${sitemapResult.sitemapsFetched} sitemaps`)
    }

    // Step 3: Validate, normalize, and filter by SKU
    const validUrls: { url: string; sku: string }[] = []
    let skuExtractionFailed = 0

    for (const entry of sitemapResult.urls) {
      const normalized = config.urlNormalizer(entry.loc)

      if (!config.urlValidator(normalized)) {
        urlsInvalid++
        continue
      }

      const sku = config.skuExtractor(normalized)
      if (!sku) {
        skuExtractionFailed++
        urlsInvalid++
        continue
      }

      validUrls.push({ url: normalized, sku })
    }

    if (options.verbose) {
      console.log(
        `[Discovery] ${validUrls.length} valid URLs with SKUs, ${urlsInvalid} invalid (${skuExtractionFailed} SKU extraction failed)`,
      )
    }

    // Step 4: Compare by SKU and identify new products
    const newProducts: { url: string; sku: string }[] = []
    const seenSkus = new Set<string>() // Avoid duplicates within sitemap

    for (const { url, sku } of validUrls) {
      if (existingSkus.has(sku)) {
        urlsExisting++
      } else if (seenSkus.has(sku)) {
        // Duplicate within sitemap, skip
        urlsExisting++
      } else {
        seenSkus.add(sku)
        newProducts.push({ url, sku })
      }
    }

    if (options.verbose) {
      console.log(`[Discovery] ${newProducts.length} new products (by SKU), ${urlsExisting} existing`)
    }

    // Apply max limit if specified
    const productsToInsert = options.maxUrls ? newProducts.slice(0, options.maxUrls) : newProducts

    // Step 5: Insert new products
    const supabase = createAdminClient()

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE)

      if (options.verbose) {
        console.log(
          `[Discovery] Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(productsToInsert.length / BATCH_SIZE)}`,
        )
      }

      if (!options.dryRun) {
        const { error: insertError } = await supabase.from("store_products").insert(
          batch.map(({ url }) => ({
            url,
            origin_id: config.originId,
            created_at: now(),
            available: true,
            priority: 0, // Unclassified
          })),
        )

        if (insertError) {
          errors.push(`Insert error: ${insertError.message}`)
        } else {
          urlsNew += batch.length
          newUrls.push(...batch.slice(0, 10).map((p) => p.url))
        }
      } else {
        urlsNew += batch.length
        newUrls.push(...batch.slice(0, 10).map((p) => p.url))
      }
    }

    if (options.verbose) {
      console.log(`[Discovery] Complete: ${urlsNew} new, ${urlsExisting} existing, ${urlsInvalid} invalid`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    errors.push(message)
  }

  return {
    originId: config.originId,
    originName: config.name,
    source: "sitemap",
    urlsFound,
    urlsNew,
    urlsExisting,
    urlsInvalid,
    errors,
    durationMs: Date.now() - startTime,
    sampleNewUrls: newUrls.slice(0, 20),
  }
}

/**
 * Runs sitemap discovery for all configured stores
 */
export async function runAllSitemapDiscovery(options: DiscoveryOptions = {}): Promise<DiscoveryResult[]> {
  const configs = getAllStoreConfigs()
  const results: DiscoveryResult[] = []

  for (const config of configs) {
    const result = await runSitemapDiscovery(config.originId, options)
    results.push(result)
  }

  return results
}

/**
 * Saves a discovery run to the database for metrics tracking
 */
export async function saveDiscoveryRun(run: DiscoveryRun): Promise<{ id: number | null; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("discovery_runs")
      .insert({
        origin_id: run.origin_id,
        discovery_source: run.discovery_source,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        urls_found: run.urls_found,
        urls_new: run.urls_new,
        urls_existing: run.urls_existing,
        urls_invalid: run.urls_invalid,
        errors: run.errors,
        metadata: run.metadata,
      })
      .select("id")
      .single()

    if (error) {
      return { id: null, error: error.message }
    }

    return { id: data?.id || null, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { id: null, error: message }
  }
}

/**
 * Gets discovery coverage stats for a store
 */
export async function getDiscoveryCoverage(originId: number): Promise<{
  totalProducts: number
  fromSitemap: number
  lastDiscoveryRun: string | null
  error: string | null
}> {
  try {
    const supabase = createAdminClient()

    // Get total product count for this origin
    const { count: totalCount, error: countError } = await supabase
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("origin_id", originId)

    if (countError) {
      return { totalProducts: 0, fromSitemap: 0, lastDiscoveryRun: null, error: countError.message }
    }

    // Get last discovery run
    const { data: lastRun, error: runError } = await supabase
      .from("discovery_runs")
      .select("completed_at")
      .eq("origin_id", originId)
      .eq("discovery_source", "sitemap")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (runError && !runError.message.includes("does not exist")) {
      return { totalProducts: totalCount || 0, fromSitemap: 0, lastDiscoveryRun: null, error: runError.message }
    }

    return {
      totalProducts: totalCount || 0,
      fromSitemap: 0, // Would need discovery_source on store_products to track this
      lastDiscoveryRun: lastRun?.completed_at || null,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { totalProducts: 0, fromSitemap: 0, lastDiscoveryRun: null, error: message }
  }
}
