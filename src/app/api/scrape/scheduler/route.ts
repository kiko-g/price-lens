import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  qstash,
  getBaseUrl,
  PRIORITY_REFRESH_HOURS,
  ACTIVE_PRIORITIES,
  WORKER_BATCH_SIZE,
  MAX_BATCHES_PER_RUN,
} from "@/lib/qstash"

export const maxDuration = 60 // 1 minute to find and queue products

/**
 * ADAPTIVE SCHEDULER
 *
 * Triggered by Vercel cron every 30 minutes.
 *
 * Uses the "pull" architecture:
 * 1. Query database for overdue products (database is source of truth)
 * 2. Calculate urgency score for each product
 * 3. Batch products into groups of ~40
 * 4. Send batched messages to QStash (cheap - one message per batch, not per product)
 * 5. Batch worker processes all products in the batch
 *
 * Urgency Score = hoursOverdue / thresholdHours
 * - Score > 1 means product is overdue
 * - Higher score = more urgent
 * - A P5 product 48h overdue (score=2) is more urgent than P3 product 72h overdue (score=1)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const searchParams = req.nextUrl.searchParams
  const isManualTest = searchParams.get("test") === "true"
  const dryRun = searchParams.get("dry") === "true"

  // Verify cron secret in production (skip for manual test with valid session)
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow manual test calls without secret for debugging
    if (!isManualTest) {
      console.warn("[Scheduler] Unauthorized - missing or invalid CRON_SECRET")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const supabase = createClient()
    const baseUrl = getBaseUrl()
    const batchWorkerUrl = `${baseUrl}/api/scrape/batch-worker`
    const now = new Date()

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

    // Fetch all overdue products across all active priorities
    // Limit to what we can process: WORKER_BATCH_SIZE * MAX_BATCHES_PER_RUN
    const maxProducts = WORKER_BATCH_SIZE * MAX_BATCHES_PER_RUN
    const { data: products, error } = await supabase
      .from("store_products")
      .select("id, url, name, origin_id, priority, updated_at")
      .or(orConditions.join(","))
      .not("url", "is", null)
      .in("priority", [...ACTIVE_PRIORITIES])
      .limit(maxProducts)

    if (error) {
      console.error("Scheduler query error:", error)
      return NextResponse.json({ error: "Failed to query products" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.info("[Scheduler] No overdue products found")
      return NextResponse.json({
        message: "No overdue products",
        scheduled: 0,
        duration: Date.now() - startTime,
      })
    }

    // Calculate urgency score for each product and sort by most urgent first
    const productsWithUrgency = products
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
    const batches: typeof productsWithUrgency[] = []
    for (let i = 0; i < productsWithUrgency.length; i += WORKER_BATCH_SIZE) {
      batches.push(productsWithUrgency.slice(i, i + WORKER_BATCH_SIZE))
    }

    // Limit to MAX_BATCHES_PER_RUN
    const batchesToSend = batches.slice(0, MAX_BATCHES_PER_RUN)

    // Log stats by priority (calculate early for dry run)
    const byPriority = productsWithUrgency.reduce(
      (acc, p) => {
        acc[p.priority ?? 0] = (acc[p.priority ?? 0] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    console.info(`[Scheduler] Found ${products.length} overdue products, sending ${batchesToSend.length} batches`)

    // Send batched messages to QStash
    const qstashMessages = batchesToSend.map((batch, index) => ({
      url: batchWorkerUrl,
      body: JSON.stringify({
        batchId: `${now.toISOString()}-${index}`,
        products: batch.map((p) => ({
          id: p.id,
          url: p.url,
          name: p.name,
          originId: p.origin_id,
          priority: p.priority,
        })),
      }),
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
      console.info(`[Scheduler] Dry run - would send ${qstashMessages.length} batches to ${batchWorkerUrl}`)
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
          activePriorities: ACTIVE_PRIORITIES,
        },
      })
    }

    // Send to QStash
    const hasQstash = !!process.env.QSTASH_TOKEN
    if (hasQstash) {
      try {
        await qstash.batchJSON(qstashMessages)
        qstashSuccess = qstashMessages.length
        console.info(`[Scheduler] QStash: Sent ${qstashMessages.length} batches to ${batchWorkerUrl}`)
      } catch (err) {
        console.error("[Scheduler] QStash batch error:", err)
        qstashFailed = qstashMessages.length
        qstashError = err instanceof Error ? err.message : "Unknown QStash error"
      }
    } else {
      // No QStash token - can't send
      console.warn("[Scheduler] No QSTASH_TOKEN - cannot send batches")
      qstashError = "QSTASH_TOKEN not configured"
    }

    const totalScheduled = batchesToSend.reduce((sum, batch) => sum + batch.length, 0)
    const duration = Date.now() - startTime

    console.info(`[Scheduler] Scheduled ${totalScheduled} products in ${duration}ms`, { byPriority })

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
        activePriorities: ACTIVE_PRIORITIES,
      },
    })
  } catch (error) {
    console.error("Scheduler error:", error)
    return NextResponse.json(
      { error: "Scheduler failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
