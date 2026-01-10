import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { qstash, getBaseUrl, BATCH_SIZE } from "@/lib/qstash"
import { scrapeAndReplaceProduct } from "@/lib/scrapers"
import { updatePricePoint } from "@/lib/pricing"
import {
  createBulkScrapeJob,
  getActiveBulkScrapeJobs,
  updateBulkScrapeJob,
  getBulkScrapeJob,
  type BulkScrapeJob,
} from "@/lib/kv"
import type { StoreProduct } from "@/types"

export const maxDuration = 60

// Direct mode batch size (smaller for direct processing)
const DIRECT_BATCH_SIZE = 5

interface BulkScrapeFilters {
  origins: number[]
  priorities: number[]
  missingBarcode: boolean
  available: boolean | null
  category?: string
}

/**
 * GET /api/admin/bulk-scrape
 * Returns count of matching products for given filters, or lists active jobs
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  // List active jobs
  if (action === "jobs") {
    const jobs = await getActiveBulkScrapeJobs()
    return NextResponse.json({ jobs })
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
 * Starts a new bulk scrape job
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const filters: BulkScrapeFilters = {
      origins: body.origins || [1, 2], // Default to Continente + Auchan
      priorities: body.priorities || [],
      missingBarcode: body.missingBarcode ?? true,
      available: body.available ?? null,
      category: body.category,
    }

    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const workerUrl = `${baseUrl}/api/scrape/worker`

    // Fetch matching products
    let query = supabase.from("store_products").select("id, url, name, origin_id, priority").not("url", "is", null)

    query = applyFilters(query, filters)

    const { data: products, error } = await query.limit(10000) // Safety limit

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No matching products found" }, { status: 400 })
    }

    // Create job record
    const jobId = crypto.randomUUID().slice(0, 10)
    const job: BulkScrapeJob = {
      id: jobId,
      status: "running",
      filters,
      total: products.length,
      processed: 0,
      failed: 0,
      barcodesFound: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await createBulkScrapeJob(job)

    // Queue products to QStash in batches
    let queuedCount = 0

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)

      const messages = batch.map((product) => ({
        url: workerUrl,
        body: JSON.stringify({
          productId: product.id,
          url: product.url,
          name: product.name,
          originId: product.origin_id,
          priority: product.priority,
          bulkJobId: jobId, // Track which job this belongs to
        }),
        headers: {
          "Content-Type": "application/json",
        },
        retries: 2,
      }))

      try {
        await qstash.batchJSON(messages)
        queuedCount += batch.length
      } catch (qstashError) {
        console.error(`QStash batch error:`, qstashError)
        // Continue with remaining batches
      }
    }

    // Update job with queued count
    if (queuedCount < products.length) {
      await updateBulkScrapeJob(jobId, {
        total: queuedCount,
      })
    }

    // Check if we successfully queued anything
    if (queuedCount === 0) {
      // QStash failed - likely localhost issue
      // Don't update total to 0, keep original count for potential direct mode retry
      await updateBulkScrapeJob(jobId, {
        status: "failed",
        error: "QStash failed to queue products. Use Direct Mode for local development.",
      })

      return NextResponse.json({
        jobId,
        total: products.length,
        queued: 0,
        error: "QStash cannot reach localhost. Use Direct Mode for local development.",
        mode: "qstash_failed",
      })
    }

    return NextResponse.json({
      jobId,
      total: queuedCount,
      message: `Queued ${queuedCount} products for re-scraping`,
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
    const { jobId, batchSize = DIRECT_BATCH_SIZE } = body

    // Get or create job
    let job = jobId ? await getBulkScrapeJob(jobId) : null

    if (!job) {
      // Create new job for direct mode
      const filters: BulkScrapeFilters = {
        origins: body.origins || [1, 2],
        priorities: body.priorities || [],
        missingBarcode: body.missingBarcode ?? true,
        available: body.available ?? null,
        category: body.category,
      }

      const supabase = createClient()

      // Count total matching products
      let countQuery = supabase.from("store_products").select("id", { count: "exact", head: true })
      countQuery = applyFilters(countQuery, filters)
      const { count } = await countQuery

      const newJobId = crypto.randomUUID().slice(0, 10)
      job = {
        id: newJobId,
        status: "running",
        filters,
        total: count ?? 0,
        processed: 0,
        failed: 0,
        barcodesFound: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await createBulkScrapeJob(job)

      return NextResponse.json({
        jobId: newJobId,
        total: count ?? 0,
        processed: 0,
        message: "Direct mode job created. Call PATCH again to process batches.",
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

    // Fetch next batch of products to process
    let query = supabase
      .from("store_products")
      .select("id, url, name, origin_id, priority, barcode")
      .not("url", "is", null)

    query = applyFilters(query, job.filters)

    // Skip already processed products by using offset
    const { data: products, error } = await query
      .order("id", { ascending: true })
      .range(job.processed, job.processed + batchSize - 1)

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

          // Scrape
          const response = await scrapeAndReplaceProduct(
            product.url,
            product.origin_id,
            existingProduct as StoreProduct | undefined,
          )
          const json = await response.json()

          if (response.status !== 200) {
            return { success: false, productId: product.id, error: json.error }
          }

          // Update price point
          await updatePricePoint({ ...json.data, id: product.id })

          const newBarcode = json.data?.barcode
          const barcodeFound = !hadBarcode && !!newBarcode

          return { success: true, productId: product.id, barcodeFound, barcode: newBarcode }
        } catch (err) {
          return { success: false, productId: product.id, error: String(err) }
        }
      }),
    )

    // Count results
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length
    const barcodesFound = results.filter((r) => r.success && r.barcodeFound).length

    // Update job progress
    const newProcessed = job.processed + products.length
    const isComplete = newProcessed >= job.total

    await updateBulkScrapeJob(job.id, {
      processed: newProcessed,
      failed: job.failed + failCount,
      barcodesFound: job.barcodesFound + barcodesFound,
      status: isComplete ? "completed" : "running",
      completedAt: isComplete ? new Date().toISOString() : undefined,
    })

    return NextResponse.json({
      jobId: job.id,
      status: isComplete ? "completed" : "running",
      batchProcessed: products.length,
      batchSuccess: successCount,
      batchFailed: failCount,
      batchBarcodesFound: barcodesFound,
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

  return {
    origins: originsParam
      ? originsParam
          .split(",")
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n))
      : [1, 2], // Default: Continente + Auchan (skip Pingo Doce)
    priorities: prioritiesParam
      ? prioritiesParam
          .split(",")
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n))
      : [],
    missingBarcode: searchParams.get("missingBarcode") !== "false",
    available: availableParam === null ? null : availableParam === "true",
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

  // Only products with valid names (not blank entries)
  q = q.not("name", "is", null)

  return q
}
