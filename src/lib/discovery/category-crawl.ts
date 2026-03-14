import { createAdminClient } from "@/lib/supabase/server"
import { fetchAll } from "@/lib/supabase/fetch-all"
import type { CategoryCrawlConfig, DiscoveryResult, DiscoveryOptions } from "./types"
import { getCategoryCrawlConfig } from "./stores"
import { now } from "@/lib/utils"

const INSERT_BATCH_SIZE = 500
const USER_AGENT = "Mozilla/5.0 (compatible; PriceLens/1.0)"

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches the product catalog page and extracts L1 (top-level) category IDs.
 */
async function fetchCategoryIds(config: CategoryCrawlConfig, verbose?: boolean): Promise<string[]> {
  const res = await fetch(config.categoryListUrl, {
    headers: { "User-Agent": USER_AGENT },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch category list page: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()

  const allIds = new Set<string>()
  const regex = new RegExp(config.categoryIdPattern.source, config.categoryIdPattern.flags)
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    allIds.add(match[1])
  }

  // Filter to L1 categories only (fewest underscore segments)
  const l1Ids = [...allIds].filter((id) => {
    const segments = id.split("_").length
    return segments === config.l1SegmentCount
  })

  if (verbose) {
    console.log(`[CategoryCrawl] Found ${allIds.size} total category IDs, ${l1Ids.length} L1 categories`)
  }

  return l1Ids
}

/**
 * Paginates through a single category, extracting all product URLs.
 */
async function fetchProductUrlsFromCategory(
  config: CategoryCrawlConfig,
  cgid: string,
  verbose?: boolean,
): Promise<string[]> {
  const urls: string[] = []
  let start = 0

  while (true) {
    const endpoint = `${config.searchEndpoint}?cgid=${cgid}&sz=${config.pageSize}&start=${start}`

    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if (!res.ok) {
      if (verbose) {
        console.log(`[CategoryCrawl] ${cgid} page at start=${start} returned ${res.status}, stopping`)
      }
      break
    }

    const html = await res.text()

    const pageUrls: string[] = []
    const regex = new RegExp(config.productUrlPattern.source, config.productUrlPattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      pageUrls.push(match[1])
    }

    if (pageUrls.length === 0) {
      break
    }

    urls.push(...pageUrls)
    start += config.pageSize

    if (verbose && start % 1000 === 0) {
      console.log(`[CategoryCrawl]   ${cgid}: ${urls.length} URLs so far (start=${start})`)
    }

    if (config.delayMs > 0) {
      await sleep(config.delayMs)
    }
  }

  return urls
}

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
    console.error(`[CategoryCrawl] Error fetching existing products:`, error.message)
    return new Set<string>()
  }

  const existingSkus = new Set<string>()
  for (const p of data) {
    if (p.url) {
      const sku = skuExtractor(p.url as string)
      if (sku) existingSkus.add(sku)
    }
  }

  if (verbose) {
    console.log(`[CategoryCrawl] Loaded ${existingSkus.size} existing SKUs`)
  }
  return existingSkus
}

async function fetchVetoedSkus(originId: number, verbose?: boolean): Promise<Set<string>> {
  const supabase = createAdminClient()

  const { data, error } = await fetchAll(() =>
    supabase.from("vetoed_store_skus").select("sku").eq("origin_id", originId).order("sku", { ascending: true }),
  )

  if (error) {
    if (verbose) {
      console.log(`[CategoryCrawl] vetoed_store_skus not available, skipping veto check`)
    }
    return new Set<string>()
  }

  const skus = new Set(data.map((r) => r.sku as string))
  if (verbose) {
    console.log(`[CategoryCrawl] Loaded ${skus.size} vetoed SKUs`)
  }
  return skus
}

/**
 * Runs category crawl discovery for a specific store.
 * Crawls L1 categories via the SFCC Search-UpdateGrid endpoint,
 * deduplicates by SKU, filters vetoed, and inserts new products.
 */
export async function runCategoryCrawlDiscovery(
  originId: number,
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const startTime = Date.now()
  const config = getCategoryCrawlConfig(originId)

  if (!config) {
    return {
      originId,
      originName: "Unknown",
      source: "category_crawl",
      urlsFound: 0,
      urlsNew: 0,
      urlsExisting: 0,
      urlsInvalid: 0,
      urlsVetoed: 0,
      errors: [`No category crawl config for origin ${originId}`],
      durationMs: Date.now() - startTime,
      sampleNewUrls: [],
    }
  }

  const errors: string[] = []
  let urlsFound = 0
  let urlsNew = 0
  let urlsExisting = 0
  let urlsInvalid = 0
  let urlsVetoed = 0
  const newUrls: string[] = []

  try {
    if (options.verbose) {
      console.log(`[CategoryCrawl] Starting category crawl for ${config.name}`)
      console.log(`[CategoryCrawl] Loading existing products and vetoed SKUs...`)
    }

    const [existingSkus, vetoedSkus] = await Promise.all([
      fetchAllExistingSkus(config.originId, config.skuExtractor, options.verbose),
      fetchVetoedSkus(config.originId, options.verbose),
    ])

    if (options.verbose) {
      console.log(`[CategoryCrawl] Found ${existingSkus.size} existing + ${vetoedSkus.size} vetoed SKUs`)
    }

    const categoryIds = await fetchCategoryIds(config, options.verbose)

    // Crawl each L1 category, collecting all product URLs
    const allRawUrls: string[] = []
    for (const cgid of categoryIds) {
      if (options.verbose) {
        console.log(`[CategoryCrawl] Crawling category ${cgid}...`)
      }
      const categoryUrls = await fetchProductUrlsFromCategory(config, cgid, options.verbose)
      allRawUrls.push(...categoryUrls)

      if (options.verbose) {
        console.log(`[CategoryCrawl]   ${cgid}: ${categoryUrls.length} URLs`)
      }
    }

    urlsFound = allRawUrls.length

    if (options.verbose) {
      console.log(`[CategoryCrawl] Total raw URLs: ${urlsFound} from ${categoryIds.length} categories`)
    }

    // Validate, normalize, extract SKUs
    const validUrls: { url: string; sku: string }[] = []
    let skuExtractionFailed = 0

    for (const rawUrl of allRawUrls) {
      const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${config.baseUrl}${rawUrl}`
      const normalized = config.urlNormalizer(fullUrl)

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
        `[CategoryCrawl] ${validUrls.length} valid URLs, ${urlsInvalid} invalid (${skuExtractionFailed} SKU extraction failed)`,
      )
    }

    // Deduplicate and classify
    const newProducts: { url: string; sku: string }[] = []
    const seenSkus = new Set<string>()

    for (const { url, sku } of validUrls) {
      if (vetoedSkus.has(sku)) {
        urlsVetoed++
      } else if (existingSkus.has(sku)) {
        urlsExisting++
      } else if (seenSkus.has(sku)) {
        // Duplicate within this crawl (product appears in multiple categories)
      } else {
        seenSkus.add(sku)
        newProducts.push({ url, sku })
      }
    }

    // Count unique existing (many duplicates across categories)
    urlsExisting = validUrls.filter(({ sku }) => existingSkus.has(sku) && !vetoedSkus.has(sku)).length

    if (options.verbose) {
      console.log(
        `[CategoryCrawl] ${newProducts.length} new unique, ${seenSkus.size + existingSkus.size} total unique, ${urlsVetoed} vetoed`,
      )
    }

    const productsToInsert = options.maxUrls ? newProducts.slice(0, options.maxUrls) : newProducts

    const supabase = createAdminClient()

    for (let i = 0; i < productsToInsert.length; i += INSERT_BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + INSERT_BATCH_SIZE)

      if (options.verbose) {
        console.log(
          `[CategoryCrawl] Inserting batch ${Math.floor(i / INSERT_BATCH_SIZE) + 1}/${Math.ceil(productsToInsert.length / INSERT_BATCH_SIZE)}`,
        )
      }

      if (!options.dryRun) {
        const { error: insertError } = await supabase.from("store_products").insert(
          batch.map(({ url }) => {
            const cats = config.categoryExtractor?.(url)
            return {
              url,
              origin_id: config.originId,
              created_at: now(),
              available: true,
              priority: null,
              ...(cats?.category && { category: cats.category }),
              ...(cats?.category2 && { category_2: cats.category2 }),
              ...(cats?.category3 && { category_3: cats.category3 }),
            }
          }),
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
      console.log(
        `[CategoryCrawl] Complete: ${urlsNew} new, ${urlsExisting} existing (duped across cats), ${urlsVetoed} vetoed, ${urlsInvalid} invalid`,
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    errors.push(message)
  }

  return {
    originId: config.originId,
    originName: config.name,
    source: "category_crawl",
    urlsFound,
    urlsNew,
    urlsExisting,
    urlsInvalid,
    urlsVetoed,
    errors,
    durationMs: Date.now() - startTime,
    sampleNewUrls: newUrls.slice(0, 20),
  }
}
