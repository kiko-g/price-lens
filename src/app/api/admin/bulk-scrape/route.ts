import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { qstash, getBaseUrl, WORKER_BATCH_SIZE } from "@/lib/qstash"
import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/business/pricing"
import {
  createBulkScrapeJob,
  getActiveBulkScrapeJobs,
  updateBulkScrapeJob,
  getBulkScrapeJob,
  type BulkScrapeJob,
} from "@/lib/kv"
import type { StoreProduct } from "@/types"

export const maxDuration = 120

// Page size for cursor-based pagination (under Supabase 1000-row cap)
const FETCH_PAGE_SIZE = 900

// QStash batchJSON supports up to 100 messages per call
const QSTASH_BATCH_LIMIT = 100

// Direct mode batch size (smaller for direct processing)
const DIRECT_BATCH_SIZE = 5

interface BulkScrapeFilters {
  origins: number[]
  priorities: number[]
  missingBarcode: boolean
  available: boolean | null
  onlyUrl: boolean
  category?: string
}

/**
 * GET /api/admin/bulk-scrape
 * Returns count of matching products for given filters, lists active jobs, or returns products list
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  // List active jobs
  if (action === "jobs") {
    const jobs = await getActiveBulkScrapeJobs()
    return NextResponse.json({ jobs })
  }

  // List matching products with pagination
  if (action === "products") {
    const filters = parseFilters(searchParams)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10)
    const offset = (page - 1) * pageSize

    const supabase = createClient()

    // Get count first
    let countQuery = supabase.from("store_products").select("id", { count: "exact", head: true })
    countQuery = applyFilters(countQuery, filters)
    const { count } = await countQuery

    // Get products with pagination
    let query = supabase
      .from("store_products")
      .select(
        "id, url, name, brand, barcode, price, image, origin_id, priority, available, category, updated_at, last_http_status",
      )

    query = applyFilters(query, filters)

    const { data: products, error } = await query
      .order("scraped_at", { ascending: true, nullsFirst: true }) // Stale products first
      .order("priority", { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products ?? [],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    })
  }

  // Count matching products
  const filters = parseFilters(searchParams)
  const supabase = createClient()

  let query = supabase.from("store_products").select("id", { count: "exact", head: true })

  query = applyFilters(query, filters)

  const { count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0, filters })
}

/**
 * POST /api/admin/bulk-scrape
 * Starts a QStash bulk scrape job. Fetches all matching products via cursor-based
 * pagination, groups them into batches of WORKER_BATCH_SIZE, and fans out to
 * /api/scrape/batch-worker via QStash. Each batch runs on a separate Vercel
 * function (different IP), giving natural IP rotation for large scrapes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const filters: BulkScrapeFilters = {
      origins: body.origins || [1, 2],
      priorities: body.priorities || [],
      missingBarcode: body.missingBarcode ?? true,
      available: body.available ?? null,
      onlyUrl: body.onlyUrl ?? false,
      category: body.category,
    }
    const limit: number | null = body.limit ?? null

    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const batchWorkerUrl = `${baseUrl}/api/scrape/batch-worker`

    // Wide column set so batch-worker skips per-product SELECTs
    const COLUMNS =
      "id, url, name, origin_id, priority, priority_source, barcode, brand, image, pack, category, category_2, category_3, created_at, updated_at"

    // --- Cursor-based pagination to fetch ALL matching products (no 10k cap) ---
    type ProductRow = {
      id: number
      url: string
      name: string | null
      origin_id: number
      priority: number
      priority_source: string | null
      barcode: string | null
      brand: string | null
      image: string | null
      pack: string | null
      category: string | null
      category_2: string | null
      category_3: string | null
      created_at: string | null
      updated_at: string | null
    }

    const allProducts: ProductRow[] = []
    let lastId = 0
    const maxProducts = limit ?? Infinity

    while (allProducts.length < maxProducts) {
      let q = supabase
        .from("store_products")
        .select(COLUMNS)
        .not("url", "is", null)
        .gt("id", lastId)
        .order("id", { ascending: true })
        .limit(Math.min(FETCH_PAGE_SIZE, maxProducts - allProducts.length))

      q = applyFilters(q, filters)

      const { data: page, error } = await q
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!page || page.length === 0) break

      allProducts.push(...(page as ProductRow[]))
      lastId = page[page.length - 1].id

      if (page.length < FETCH_PAGE_SIZE) break
    }

    if (allProducts.length === 0) {
      return NextResponse.json({ error: "No matching products found" }, { status: 400 })
    }

    console.log(`[BulkScrape] Fetched ${allProducts.length} products for QStash fan-out`)

    // --- Create job record ---
    const jobId = crypto.randomUUID().slice(0, 10)
    const job: BulkScrapeJob = {
      id: jobId,
      status: "running",
      filters,
      total: allProducts.length,
      processed: 0,
      failed: 0,
      barcodesFound: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await createBulkScrapeJob(job)

    // --- Build batch-worker payloads ---
    const batchMessages: { url: string; body: Record<string, unknown>; retries: number }[] = []
    for (let i = 0; i < allProducts.length; i += WORKER_BATCH_SIZE) {
      const chunk = allProducts.slice(i, i + WORKER_BATCH_SIZE)
      const batchId = `${jobId}-${Math.floor(i / WORKER_BATCH_SIZE)}`

      batchMessages.push({
        url: batchWorkerUrl,
        body: {
          batchId,
          bulkJobId: jobId,
          products: chunk.map((p) => ({
            id: p.id,
            url: p.url,
            name: p.name,
            originId: p.origin_id,
            priority: p.priority,
            prioritySource: p.priority_source,
            barcode: p.barcode,
            brand: p.brand,
            image: p.image,
            pack: p.pack,
            category: p.category,
            category2: p.category_2,
            category3: p.category_3,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })),
        },
        retries: 2,
      })
    }

    console.log(`[BulkScrape] Sending ${batchMessages.length} batch messages to QStash`)

    // --- Send to QStash (respecting 100-message-per-call limit) ---
    let queuedBatches = 0
    let queuedProducts = 0

    for (let i = 0; i < batchMessages.length; i += QSTASH_BATCH_LIMIT) {
      const slice = batchMessages.slice(i, i + QSTASH_BATCH_LIMIT)
      try {
        await qstash.batchJSON(slice)
        queuedBatches += slice.length
        queuedProducts += slice.reduce(
          (sum, msg) => sum + ((msg.body as { products?: unknown[] }).products?.length ?? 0),
          0,
        )
      } catch (err) {
        console.error(`[BulkScrape] QStash batch error (offset ${i}):`, err)
      }
    }

    if (queuedBatches === 0) {
      await updateBulkScrapeJob(jobId, {
        status: "failed",
        error: "QStash failed to queue any batches. Check QSTASH_TOKEN and NEXT_PUBLIC_SITE_URL.",
      })
      return NextResponse.json(
        { jobId, total: allProducts.length, queued: 0, error: "QStash failed to deliver messages", mode: "qstash" },
        { status: 502 },
      )
    }

    // Adjust total to only count products we actually queued
    if (queuedProducts < allProducts.length) {
      await updateBulkScrapeJob(jobId, { total: queuedProducts })
    }

    return NextResponse.json({
      jobId,
      total: queuedProducts,
      batches: queuedBatches,
      batchSize: WORKER_BATCH_SIZE,
      message: `Queued ${queuedProducts} products in ${queuedBatches} batches`,
      mode: "qstash",
    })
  } catch (error) {
    console.error("Bulk scrape error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/bulk-scrape
 * Direct mode - processes a batch of products without QStash
 * Used for local development where QStash can't reach localhost
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobId, batchSize = DIRECT_BATCH_SIZE, useAntiBlock = true, limit } = body

    // Get or create job
    let job = jobId ? await getBulkScrapeJob(jobId) : null

    if (!job) {
      // Create new job for direct mode
      const filters: BulkScrapeFilters = {
        origins: body.origins || [1, 2],
        priorities: body.priorities || [],
        missingBarcode: body.missingBarcode ?? true,
        available: body.available ?? null,
        onlyUrl: body.onlyUrl ?? false,
        category: body.category,
      }

      const supabase = createClient()

      // Count total matching products
      let countQuery = supabase.from("store_products").select("id", { count: "exact", head: true })
      countQuery = applyFilters(countQuery, filters)
      const { count } = await countQuery

      // Apply job limit if specified (cap total products to process)
      const matchingCount = count ?? 0
      const jobTotal = limit ? Math.min(matchingCount, limit) : matchingCount

      const newJobId = crypto.randomUUID().slice(0, 10)
      job = {
        id: newJobId,
        status: "running",
        filters,
        total: jobTotal,
        processed: 0,
        failed: 0,
        barcodesFound: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await createBulkScrapeJob(job)

      return NextResponse.json({
        jobId: newJobId,
        total: jobTotal,
        matching: matchingCount, // Include total matching for reference
        processed: 0,
        message: limit
          ? `Direct mode job created with limit of ${jobTotal} products.`
          : "Direct mode job created. Call PATCH again to process batches.",
        mode: "direct",
      })
    }

    // Check if job is cancelled or completed
    if (job.status === "cancelled" || job.status === "completed") {
      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        message: "Job already finished",
      })
    }

    const supabase = createClient()

    // Fetch next batch of products to process using cursor-based pagination
    // This ensures we don't skip products when the filtered result set changes
    let query = supabase
      .from("store_products")
      .select("id, url, name, origin_id, priority, barcode")
      .not("url", "is", null)
      .gt("id", job.lastProcessedId ?? 0) // Cursor: fetch products with ID > last processed

    query = applyFilters(query, { ...job.filters, onlyUrl: job.filters.onlyUrl ?? false })

    const { data: products, error } = await query.order("id", { ascending: true }).limit(batchSize)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      // No more products to process
      await updateBulkScrapeJob(job.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      })

      return NextResponse.json({
        jobId: job.id,
        status: "completed",
        processed: job.processed,
        failed: job.failed,
        barcodesFound: job.barcodesFound,
        message: "All products processed",
      })
    }

    // Process batch directly
    const results = await Promise.all(
      products.map(async (product) => {
        try {
          const hadBarcode = !!product.barcode

          // Fetch full product data
          const { data: existingProduct } = await supabase
            .from("store_products")
            .select("*")
            .eq("id", product.id)
            .single()

          // Scrape with configurable anti-blocking
          const response = await scrapeAndReplaceProduct(
            product.url,
            product.origin_id,
            existingProduct as StoreProduct | undefined,
            useAntiBlock,
          )
          const json = await response.json()

          if (response.status === 404) {
            // Product not found / unavailable
            return {
              success: false,
              productId: product.id,
              status: "unavailable",
              error: json.error || "Product not found (404)",
              url: product.url,
              lastHttpStatus: json.last_http_status ?? null,
            }
          }

          if (response.status !== 200) {
            const details = json.details
            return {
              success: false,
              productId: product.id,
              status: "error",
              statusCode: response.status,
              error: json.error || `HTTP ${response.status}`,
              details: details ? `${details.message || ""} (code: ${details.code || "?"})` : undefined,
              url: product.url,
              lastHttpStatus: json.last_http_status ?? null,
            }
          }

          // Update price point
          await updatePricePoint({ ...json.data, id: product.id })

          const newBarcode = json.data?.barcode
          const barcodeFound = !hadBarcode && !!newBarcode

          return { success: true, productId: product.id, status: "success", barcodeFound, barcode: newBarcode }
        } catch (err) {
          return {
            success: false,
            productId: product.id,
            status: "error",
            error: String(err),
            url: product.url,
          }
        }
      }),
    )

    // Count results with more detail
    const successCount = results.filter((r) => r.success).length
    const unavailableCount = results.filter((r) => !r.success && r.status === "unavailable").length
    const errorCount = results.filter((r) => !r.success && r.status === "error").length
    const barcodesFound = results.filter((r) => r.success && r.barcodeFound).length

    // Collect errors for logging
    const errors = results
      .filter((r) => !r.success)
      .map((r) => ({
        productId: r.productId,
        status: r.status,
        statusCode: (r as { statusCode?: number }).statusCode,
        error: (r as { error?: string }).error,
        details: (r as { details?: string }).details,
        url: (r as { url?: string }).url,
        lastHttpStatus: (r as { lastHttpStatus?: number | null }).lastHttpStatus,
      }))

    // Update job progress with cursor for next batch
    const newProcessed = job.processed + products.length
    const lastId = products[products.length - 1]?.id ?? job.lastProcessedId
    const isComplete = newProcessed >= job.total

    await updateBulkScrapeJob(job.id, {
      processed: newProcessed,
      failed: job.failed + errorCount + unavailableCount,
      barcodesFound: job.barcodesFound + barcodesFound,
      lastProcessedId: lastId, // Store cursor for ID-based pagination
      status: isComplete ? "completed" : "running",
      completedAt: isComplete ? new Date().toISOString() : undefined,
    })

    return NextResponse.json({
      jobId: job.id,
      status: isComplete ? "completed" : "running",
      batchProcessed: products.length,
      batchSuccess: successCount,
      batchUnavailable: unavailableCount,
      batchErrors: errorCount,
      batchBarcodesFound: barcodesFound,
      errors, // Include error details for logging
      totalProcessed: newProcessed,
      totalRemaining: job.total - newProcessed,
      mode: "direct",
    })
  } catch (error) {
    console.error("Direct scrape error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// Helper functions

function parseFilters(searchParams: URLSearchParams): BulkScrapeFilters {
  const originsParam = searchParams.get("origins")
  const prioritiesParam = searchParams.get("priorities")
  const availableParam = searchParams.get("available")

  // Parse origins - empty string means "all origins" (no filter)
  // Only default to [1, 2] if origins param is not provided at all
  let origins: number[] = []
  if (originsParam === null) {
    // Param not provided - use default (Continente + Auchan)
    origins = [1, 2]
  } else if (originsParam !== "") {
    // Param provided with values - parse them
    origins = originsParam
      .split(",")
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n))
  }
  // else: empty string means no filter (all origins)

  return {
    origins,
    priorities: prioritiesParam
      ? prioritiesParam
          .split(",")
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n))
      : [],
    missingBarcode: searchParams.get("missingBarcode") !== "false",
    available: availableParam === null ? null : availableParam === "true",
    onlyUrl: searchParams.get("onlyUrl") === "true",
    category: searchParams.get("category") || undefined,
  }
}

function applyFilters<T extends { in: any; is: any; eq: any; not: any }>(query: T, filters: BulkScrapeFilters): T {
  let q = query

  // Origin filter
  if (filters.origins.length > 0) {
    q = q.in("origin_id", filters.origins)
  }

  // Priority filter
  if (filters.priorities.length > 0) {
    q = q.in("priority", filters.priorities)
  }

  // Missing barcode filter
  if (filters.missingBarcode) {
    q = q.is("barcode", null)
  }

  // Availability filter
  if (filters.available !== null) {
    q = q.eq("available", filters.available)
  }

  // Category filter
  if (filters.category) {
    q = q.eq("category", filters.category)
  }

  // Only URL filter - products that have only URL (no name scraped yet)
  // When onlyUrl is true, filter for products with no name (never scraped)
  // When onlyUrl is false (default), don't apply any name filter - show all products
  if (filters.onlyUrl) {
    q = q.is("name", null)
  }
  // Note: We intentionally don't filter by name when onlyUrl is false
  // This allows the default view to show ALL products (including unscraped ones)

  return q
}
