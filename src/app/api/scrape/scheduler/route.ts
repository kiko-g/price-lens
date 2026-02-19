import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  qstash,
  getBaseUrl,
  PRIORITY_REFRESH_HOURS,
  ACTIVE_PRIORITIES,
  WORKER_BATCH_SIZE,
  MAX_BATCHES_PER_RUN,
  CRON_FREQUENCY_MINUTES,
} from "@/lib/qstash"
import { analyzeSchedulerCapacity } from "@/lib/business/priority"

export const maxDuration = 300 // 5 minutes at most to find and queue products

/**
 * ADAPTIVE SCHEDULER
 *
 * Triggered by Vercel cron every 15 minutes.
 *
 * Uses the "pull" architecture:
 * 1. Query database for overdue products (database is source of truth)
 * 2. Calculate urgency score for each product
 * 3. Batch products into groups of ~50
 * 4. Send batched messages to QStash (cheap - one message per batch, not per product)
 * 5. Batch worker processes all products in the batch
 *
 * Urgency Score = hoursOverdue / thresholdHours
 * - Score > 1 means product is overdue
 * - Higher score = more urgent
 * - A P5 product 48h overdue (score=2) is more urgent than P3 product 72h overdue (score=1)
 */
export async function GET(req: NextRequest) {
  // Immediately log to confirm function is called
  console.log("[Scheduler] === CRON INVOKED ===")

  const startTime = Date.now()
  const searchParams = req.nextUrl.searchParams
  const isManualTest = searchParams.get("test") === "true"
  const dryRun = searchParams.get("dry") === "true"

  // Log every invocation for debugging
  const authHeader = req.headers.get("authorization")
  console.log("[Scheduler] Config:", {
    isManualTest,
    dryRun,
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!process.env.CRON_SECRET,
    hasQstashToken: !!process.env.QSTASH_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  })

  // NOTE: CRON_SECRET check temporarily disabled for debugging
  // Once cron is working, re-enable with:
  // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // }

  try {
    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const batchWorkerUrl = `${baseUrl}/api/scrape/batch-worker`
    const now = new Date()

    // Query product counts by priority for capacity analysis using proper count queries
    // NOTE: Simple select without count has a default 1000 row limit in Supabase!
    const productCountsByPriority: Record<number, number> = {}
    for (const priority of ACTIVE_PRIORITIES) {
      const { count } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .eq("priority", priority)
        .not("url", "is", null)
      productCountsByPriority[priority] = count ?? 0
    }

    // Calculate capacity health
    const capacityAnalysis = analyzeSchedulerCapacity(
      productCountsByPriority,
      WORKER_BATCH_SIZE,
      MAX_BATCHES_PER_RUN,
      CRON_FREQUENCY_MINUTES,
    )

    // Log capacity status
    console.log(
      `[Scheduler] Capacity: ${capacityAnalysis.status} (${capacityAnalysis.utilizationPercent}% utilization)`,
    )
    if (capacityAnalysis.status === "critical") {
      console.warn(`[Scheduler] CRITICAL: Deficit of ${capacityAnalysis.deficit} scrapes/day`)
    }

    // Build OR conditions for each priority's staleness threshold
    const orConditions = ACTIVE_PRIORITIES.map((priority) => {
      const thresholdHours = PRIORITY_REFRESH_HOURS[priority]
      if (!thresholdHours) return null
      const cutoffTime = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString()
      return `and(priority.eq.${priority},or(updated_at.lt.${cutoffTime},updated_at.is.null))`
    }).filter(Boolean)

    if (orConditions.length === 0) {
      return NextResponse.json({ message: "No active priorities configured", scheduled: 0 })
    }

    // Fetch overdue products with count to get accurate backlog size
    // Use a high limit to get the real backlog count, then we'll slice for actual scheduling
    // Fetch wider column set so the batch worker doesn't need to re-read each product.
    // The extra fields are passed through QStash to eliminate per-product SELECTs.
    const SCHEDULER_COLUMNS = "id, url, name, origin_id, priority, priority_source, barcode, brand, image, pack, category, category_2, category_3, created_at, updated_at"

    const {
      data: products,
      count: backlogSize,
      error,
    } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS, { count: "exact" })
      .or(orConditions.join(","))
      .not("url", "is", null)
      .eq("available", true)
      .in("priority", [...ACTIVE_PRIORITIES])
      .limit(WORKER_BATCH_SIZE * MAX_BATCHES_PER_RUN)

    if (error) {
      console.error("Scheduler query error:", error)
      return NextResponse.json({ error: "Failed to query products" }, { status: 500 })
    }

    // Re-check a small batch of unavailable products weekly to catch any that come back
    const RECHECK_BATCH_SIZE = 50
    const recheckCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recheckProducts } = await supabase
      .from("store_products")
      .select(SCHEDULER_COLUMNS)
      .eq("available", false)
      .not("url", "is", null)
      .in("priority", [...ACTIVE_PRIORITIES])
      .or(`updated_at.lt.${recheckCutoff},updated_at.is.null`)
      .limit(RECHECK_BATCH_SIZE)

    if (recheckProducts && recheckProducts.length > 0) {
      console.log(`[Scheduler] Re-checking ${recheckProducts.length} unavailable products`)
    }

    // Merge main products with re-check products
    const allProducts = [...(products || []), ...(recheckProducts || [])]

    if (allProducts.length === 0) {
      console.info("🛜 [Scheduler] No overdue products found")
      return NextResponse.json({
        message: "No overdue products",
        scheduled: 0,
        duration: Date.now() - startTime,
      })
    }

    // DYNAMIC BATCH SIZING based on actual backlog
    // backlogSize is the total count of overdue products (may exceed our limit)
    const actualBacklogSize = backlogSize ?? allProducts.length
    const MIN_BATCHES = 5
    const batchesNeeded = Math.ceil(actualBacklogSize / WORKER_BATCH_SIZE)
    let dynamicMaxBatches: number

    if (capacityAnalysis.status === "critical") {
      // Critical: always use max batches to try to catch up
      dynamicMaxBatches = MAX_BATCHES_PER_RUN
    } else if (actualBacklogSize <= WORKER_BATCH_SIZE * MIN_BATCHES) {
      // Small backlog: use only what we need
      dynamicMaxBatches = Math.max(MIN_BATCHES, batchesNeeded)
    } else {
      // Normal: scale between MIN and MAX based on backlog
      const utilizationFactor = Math.min(1, actualBacklogSize / (WORKER_BATCH_SIZE * MAX_BATCHES_PER_RUN * 2))
      dynamicMaxBatches = Math.round(MIN_BATCHES + (MAX_BATCHES_PER_RUN - MIN_BATCHES) * utilizationFactor)
    }

    // Never exceed the configured max
    dynamicMaxBatches = Math.min(dynamicMaxBatches, MAX_BATCHES_PER_RUN)

    console.log(
      `[Scheduler] Backlog: ${actualBacklogSize} products, using ${dynamicMaxBatches} batches (max: ${MAX_BATCHES_PER_RUN})`,
    )

    // Calculate urgency score for each product and sort by most urgent first
    const productsWithUrgency = allProducts
      .map((product) => {
        const thresholdHours = PRIORITY_REFRESH_HOURS[product.priority ?? 0] ?? 24
        const updatedAt = product.updated_at ? new Date(product.updated_at) : new Date(0) // Never scraped = very old
        const hoursAgo = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
        const urgencyScore = hoursAgo / thresholdHours

        return {
          ...product,
          urgencyScore,
          hoursOverdue: Math.max(0, hoursAgo - thresholdHours),
        }
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore) // Most urgent first

    // Split into batches
    const batches: (typeof productsWithUrgency)[] = []
    for (let i = 0; i < productsWithUrgency.length; i += WORKER_BATCH_SIZE) {
      batches.push(productsWithUrgency.slice(i, i + WORKER_BATCH_SIZE))
    }

    // Limit to dynamic max batches (already calculated based on backlog)
    const batchesToSend = batches.slice(0, dynamicMaxBatches)

    // Log stats by priority (calculate early for dry run)
    const byPriority = productsWithUrgency.reduce(
      (acc, p) => {
        acc[p.priority ?? 0] = (acc[p.priority ?? 0] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    console.log(`[Scheduler] Found ${allProducts.length} products (${products?.length ?? 0} overdue + ${recheckProducts?.length ?? 0} re-check), sending ${batchesToSend.length} batches`)

    // Send batched messages to QStash
    // NOTE: batchJSON() auto-stringifies, so pass objects NOT strings
    const qstashMessages = batchesToSend.map((batch, index) => ({
      url: batchWorkerUrl,
      body: {
        batchId: `${now.toISOString()}-${index}`,
        products: batch.map((p) => ({
          id: p.id,
          url: p.url,
          name: p.name,
          originId: p.origin_id,
          priority: p.priority,
          prioritySource: p.priority_source ?? null,
          barcode: p.barcode ?? null,
          brand: p.brand ?? null,
          image: p.image ?? null,
          pack: p.pack ?? null,
          category: p.category ?? null,
          category2: p.category_2 ?? null,
          category3: p.category_3 ?? null,
          createdAt: p.created_at ?? null,
          updatedAt: p.updated_at ?? null,
        })),
      },
      headers: {
        "Content-Type": "application/json",
      },
      retries: 2,
    }))

    let qstashSuccess = 0
    let qstashFailed = 0
    let qstashError: string | undefined

    // Dry run mode - just return what would be scheduled
    if (dryRun) {
      console.info(`🛜 [Scheduler] Dry run - would send ${qstashMessages.length} batches to ${batchWorkerUrl}`)
      return NextResponse.json({
        dryRun: true,
        message: `Would schedule ${productsWithUrgency.length} products in ${batchesToSend.length} batches`,
        scheduled: 0,
        wouldSchedule: productsWithUrgency.length,
        batches: batchesToSend.length,
        byPriority,
        batchWorkerUrl,
        hasQstashToken: !!process.env.QSTASH_TOKEN,
        nodeEnv: process.env.NODE_ENV,
        duration: Date.now() - startTime,
        sampleProducts: productsWithUrgency.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          priority: p.priority,
          urgencyScore: p.urgencyScore.toFixed(2),
          hoursOverdue: p.hoursOverdue.toFixed(1),
        })),
        config: {
          batchSize: WORKER_BATCH_SIZE,
          maxBatches: MAX_BATCHES_PER_RUN,
          cronFrequencyMinutes: CRON_FREQUENCY_MINUTES,
          activePriorities: ACTIVE_PRIORITIES,
        },
        dynamicBatching: {
          backlogSize: actualBacklogSize,
          dynamicMaxBatches,
          batchesUsed: batchesToSend.length,
          reason:
            capacityAnalysis.status === "critical"
              ? "critical-capacity"
              : actualBacklogSize <= WORKER_BATCH_SIZE * 5
                ? "small-backlog"
                : "scaled",
        },
        capacity: capacityAnalysis,
      })
    }

    // Send to QStash
    const hasQstash = !!process.env.QSTASH_TOKEN
    console.log(`[Scheduler] QStash token present: ${hasQstash}, sending to: ${batchWorkerUrl}`)

    if (hasQstash) {
      try {
        console.log(`[Scheduler] Sending ${qstashMessages.length} batches to QStash...`)
        await qstash.batchJSON(qstashMessages)
        qstashSuccess = qstashMessages.length
        console.log(`[Scheduler] QStash SUCCESS: Sent ${qstashMessages.length} batches`)
      } catch (err) {
        console.error("[Scheduler] QStash ERROR:", err)
        qstashFailed = qstashMessages.length
        qstashError = err instanceof Error ? err.message : "Unknown QStash error"
      }
    } else {
      console.log("[Scheduler] No QSTASH_TOKEN - cannot send batches")
      qstashError = "QSTASH_TOKEN not configured"
    }

    const totalScheduled = batchesToSend.reduce((sum, batch) => sum + batch.length, 0)
    const duration = Date.now() - startTime

    console.log(`[Scheduler] COMPLETE: Scheduled ${totalScheduled} products in ${duration}ms`)

    return NextResponse.json({
      message: `Scheduled ${totalScheduled} products in ${batchesToSend.length} batches`,
      scheduled: totalScheduled,
      batches: batchesToSend.length,
      byPriority,
      qstash: {
        success: qstashSuccess,
        failed: qstashFailed,
        error: qstashError,
        hasToken: !!process.env.QSTASH_TOKEN,
      },
      batchWorkerUrl,
      duration,
      config: {
        batchSize: WORKER_BATCH_SIZE,
        maxBatches: MAX_BATCHES_PER_RUN,
        cronFrequencyMinutes: CRON_FREQUENCY_MINUTES,
        activePriorities: ACTIVE_PRIORITIES,
      },
      dynamicBatching: {
        backlogSize: actualBacklogSize,
        dynamicMaxBatches,
        batchesUsed: batchesToSend.length,
        reason:
          capacityAnalysis.status === "critical"
            ? "critical-capacity"
            : actualBacklogSize <= WORKER_BATCH_SIZE * 5
              ? "small-backlog"
              : "scaled",
      },
      capacity: capacityAnalysis,
    })
  } catch (error) {
    console.error("Scheduler error:", error)
    return NextResponse.json(
      { error: "Scheduler failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
