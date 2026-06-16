import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
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
import { getLaneQuotasPerRun } from "@/lib/business/scrape-budget"
import { persistSchedulerRun } from "@/lib/business/scheduler-runs"
import {
  buildLaneFillStats,
  fetchHealingLaneProducts,
  fetchLongTailLaneProducts,
  fetchSlaLaneProducts,
  mergeLaneProducts,
  type LaneProduct,
} from "@/lib/business/scheduler-lanes"
import { isScrapeableLaneProduct, toScrapeBatchProductPayload } from "@/lib/business/scheduler-product"

export const maxDuration = 300 // 5 minutes at most to find and queue products

/**
 * ADAPTIVE SCHEDULER — budgeted lane economy (ROADMAP §2)
 *
 * Triggered by Vercel cron every 30 minutes.
 *
 * Lane A (SLA, ~80%): overdue P5..P2 available products, urgency-sorted
 * Lane B (Healing, ~10%): favorites/views, failed scrapes, phantoms, graveyard
 * Lane C (Long tail, ~10%): P1 round-robin + discovery skeleton triage drip
 */
export async function GET(req: NextRequest) {
  console.log("[Scheduler] === CRON INVOKED ===")

  const startTime = Date.now()
  const searchParams = req.nextUrl.searchParams
  const isManualTest = searchParams.get("test") === "true"
  const dryRun = searchParams.get("dry") === "true"

  const authHeader = req.headers.get("authorization")
  console.log("[Scheduler] Config:", {
    isManualTest,
    dryRun,
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!process.env.CRON_SECRET,
    hasQstashToken: !!process.env.QSTASH_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  })

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const baseUrl = getBaseUrl()
    const batchWorkerUrl = `${baseUrl}/api/scrape/batch-worker`
    const now = new Date()
    const laneQuotas = getLaneQuotasPerRun(CRON_FREQUENCY_MINUTES)

    const productCountsByPriority: Record<number, number> = {}
    for (const priority of ACTIVE_PRIORITIES) {
      const { count } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .eq("priority", priority)
        .not("url", "is", null)
      productCountsByPriority[priority] = count ?? 0
    }

    const capacityAnalysis = analyzeSchedulerCapacity(
      productCountsByPriority,
      WORKER_BATCH_SIZE,
      MAX_BATCHES_PER_RUN,
      CRON_FREQUENCY_MINUTES,
    )

    console.log(
      `[Scheduler] Capacity: ${capacityAnalysis.status} (${capacityAnalysis.utilizationPercent}% utilization)`,
    )
    if (capacityAnalysis.status === "critical") {
      console.warn(`[Scheduler] CRITICAL: Deficit of ${capacityAnalysis.deficit} scrapes/day`)
    }

    console.log(
      `[Scheduler] Lane quotas/run: SLA=${laneQuotas.sla} healing=${laneQuotas.healing} long_tail=${laneQuotas.longTail} (budget ${laneQuotas.perRunBudget}/run)`,
    )

    const [slaResult, healingResult, longTailResult] = await Promise.all([
      fetchSlaLaneProducts(supabase, now, laneQuotas.sla),
      fetchHealingLaneProducts(supabase, now, laneQuotas.healing),
      fetchLongTailLaneProducts(supabase, laneQuotas.longTail),
    ])

    const laneFill = buildLaneFillStats(laneQuotas, slaResult, healingResult, longTailResult)
    console.log(
      `[Scheduler] Lane fill: SLA ${laneFill.sla.filled}/${laneFill.sla.requested} (backlog ${laneFill.sla.backlog ?? "?"}) | healing ${laneFill.healing.filled}/${laneFill.healing.requested} | long_tail ${laneFill.long_tail.filled}/${laneFill.long_tail.requested}`,
    )

    const slaSorted = sortSlaByUrgency(slaResult.products, now)
    const allProducts = mergeLaneProducts(slaSorted, healingResult.products, longTailResult.products).filter(
      isScrapeableLaneProduct,
    )

    if (allProducts.length === 0) {
      console.info("🛜 [Scheduler] No products to schedule across any lane")
      const duration = Date.now() - startTime
      const schedulerRunId = await persistSchedulerRun(supabase, {
        startedAt: now,
        durationMs: duration,
        scheduledTotal: 0,
        batchesSent: 0,
        dryRun,
        laneQuotas,
        laneFill,
      })
      return NextResponse.json({
        message: "No products to schedule",
        scheduled: 0,
        lanes: laneFill,
        schedulerRunId,
        duration,
      })
    }

    const actualBacklogSize = slaResult.backlogSize ?? allProducts.length
    const MIN_BATCHES = 5
    const batchesNeeded = Math.ceil(allProducts.length / WORKER_BATCH_SIZE)
    let dynamicMaxBatches: number

    if (capacityAnalysis.status === "critical") {
      dynamicMaxBatches = MAX_BATCHES_PER_RUN
    } else if (allProducts.length <= WORKER_BATCH_SIZE * MIN_BATCHES) {
      dynamicMaxBatches = Math.max(MIN_BATCHES, batchesNeeded)
    } else {
      const utilizationFactor = Math.min(1, allProducts.length / (WORKER_BATCH_SIZE * MAX_BATCHES_PER_RUN * 2))
      dynamicMaxBatches = Math.round(MIN_BATCHES + (MAX_BATCHES_PER_RUN - MIN_BATCHES) * utilizationFactor)
    }

    dynamicMaxBatches = Math.min(dynamicMaxBatches, MAX_BATCHES_PER_RUN)
    const maxProductsToSend = Math.min(allProducts.length, dynamicMaxBatches * WORKER_BATCH_SIZE, laneQuotas.perRunBudget)
    const productsToSchedule = allProducts.slice(0, maxProductsToSend)

    console.log(
      `[Scheduler] Backlog: ${actualBacklogSize} SLA overdue, scheduling ${productsToSchedule.length} products in up to ${dynamicMaxBatches} batches`,
    )

    const productsWithMeta = productsToSchedule.map((product) => {
      if (product.lane !== "sla") {
        return { ...product, urgencyScore: 0, hoursOverdue: 0 }
      }
      const thresholdHours = PRIORITY_REFRESH_HOURS[product.priority ?? 0] ?? 24
      const updatedAt = product.updated_at ? new Date(product.updated_at) : new Date(0)
      const hoursAgo = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
      const baseUrgency = hoursAgo / thresholdHours
      const cv = product.price_stats_cv_ln_90d
      const volatilityBoost =
        typeof cv === "number" && Number.isFinite(cv) && cv > 1e-9 ? Math.min(0.35, cv / 0.12) : 0
      const urgencyScore = baseUrgency * (1 + volatilityBoost)
      return {
        ...product,
        urgencyScore,
        hoursOverdue: Math.max(0, hoursAgo - thresholdHours),
      }
    })

    const batches: (typeof productsWithMeta)[] = []
    for (let i = 0; i < productsWithMeta.length; i += WORKER_BATCH_SIZE) {
      batches.push(productsWithMeta.slice(i, i + WORKER_BATCH_SIZE))
    }

    const batchesToSend = batches.slice(0, dynamicMaxBatches)

    const byPriority = productsWithMeta.reduce(
      (acc, p) => {
        acc[p.priority ?? 0] = (acc[p.priority ?? 0] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    const byLane = productsWithMeta.reduce(
      (acc, p) => {
        acc[p.lane] = (acc[p.lane] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log(
      `[Scheduler] Queuing ${productsWithMeta.length} products (lanes: ${JSON.stringify(byLane)}), ${batchesToSend.length} batches`,
    )

    const qstashMessages = batchesToSend.map((batch, index) => {
      const lane = batch[0]?.lane ?? "sla"
      return {
        url: batchWorkerUrl,
        body: {
          batchId: `${lane}-${now.toISOString()}-${index}`,
          lane,
          products: batch.map((p) => toScrapeBatchProductPayload(p)),
        },
        headers: {
          "Content-Type": "application/json",
        },
        retries: 2,
      }
    })

    let qstashSuccess = 0
    let qstashFailed = 0
    let qstashError: string | undefined

    if (dryRun) {
      console.info(`🛜 [Scheduler] Dry run - would send ${qstashMessages.length} batches to ${batchWorkerUrl}`)
      const duration = Date.now() - startTime
      const schedulerRunId = await persistSchedulerRun(supabase, {
        startedAt: now,
        durationMs: duration,
        scheduledTotal: productsWithMeta.length,
        batchesSent: batchesToSend.length,
        dryRun: true,
        laneQuotas,
        laneFill,
        byLane,
        byPriority,
      })
      return NextResponse.json({
        dryRun: true,
        message: `Would schedule ${productsWithMeta.length} products in ${batchesToSend.length} batches`,
        scheduled: 0,
        wouldSchedule: productsWithMeta.length,
        batches: batchesToSend.length,
        byPriority,
        byLane,
        lanes: laneFill,
        schedulerRunId,
        batchWorkerUrl,
        hasQstashToken: !!process.env.QSTASH_TOKEN,
        nodeEnv: process.env.NODE_ENV,
        duration,
        sampleProducts: productsWithMeta.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          priority: p.priority,
          lane: p.lane,
          urgencyScore: p.urgencyScore.toFixed(2),
          hoursOverdue: p.hoursOverdue.toFixed(1),
        })),
        config: {
          batchSize: WORKER_BATCH_SIZE,
          maxBatches: MAX_BATCHES_PER_RUN,
          cronFrequencyMinutes: CRON_FREQUENCY_MINUTES,
          activePriorities: ACTIVE_PRIORITIES,
          laneQuotas,
        },
        dynamicBatching: {
          backlogSize: actualBacklogSize,
          dynamicMaxBatches,
          batchesUsed: batchesToSend.length,
          reason:
            capacityAnalysis.status === "critical"
              ? "critical-capacity"
              : allProducts.length <= WORKER_BATCH_SIZE * 5
                ? "small-backlog"
                : "scaled",
        },
        capacity: capacityAnalysis,
      })
    }

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

    const schedulerRunId = await persistSchedulerRun(supabase, {
      startedAt: now,
      durationMs: duration,
      scheduledTotal: totalScheduled,
      batchesSent: batchesToSend.length,
      dryRun: false,
      laneQuotas,
      laneFill,
      byLane,
      byPriority,
      qstashError,
    })

    console.log(`[Scheduler] COMPLETE: Scheduled ${totalScheduled} products in ${duration}ms`)

    return NextResponse.json({
      message: `Scheduled ${totalScheduled} products in ${batchesToSend.length} batches`,
      scheduled: totalScheduled,
      batches: batchesToSend.length,
      byPriority,
      byLane,
      lanes: laneFill,
      schedulerRunId,
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
        laneQuotas,
      },
      dynamicBatching: {
        backlogSize: actualBacklogSize,
        dynamicMaxBatches,
        batchesUsed: batchesToSend.length,
        reason:
          capacityAnalysis.status === "critical"
            ? "critical-capacity"
            : allProducts.length <= WORKER_BATCH_SIZE * 5
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

function sortSlaByUrgency(products: LaneProduct[], now: Date): LaneProduct[] {
  return [...products].sort((a, b) => {
    const scoreA = urgencyForProduct(a, now)
    const scoreB = urgencyForProduct(b, now)
    return scoreB - scoreA
  })
}

function urgencyForProduct(product: LaneProduct, now: Date): number {
  const thresholdHours = PRIORITY_REFRESH_HOURS[product.priority ?? 0] ?? 24
  const updatedAt = product.updated_at ? new Date(product.updated_at) : new Date(0)
  const hoursAgo = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
  const baseUrgency = hoursAgo / thresholdHours
  const cv = product.price_stats_cv_ln_90d
  const volatilityBoost = typeof cv === "number" && Number.isFinite(cv) && cv > 1e-9 ? Math.min(0.35, cv / 0.12) : 0
  return baseUrgency * (1 + volatilityBoost)
}
