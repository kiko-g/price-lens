import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  ACTIVE_PRIORITIES,
  ESTIMATED_COST_PER_SCRAPE,
  WORKER_BATCH_SIZE,
  MAX_BATCHES_PER_RUN,
  CRON_FREQUENCY_MINUTES,
} from "@/lib/qstash"
import { PRIORITY_REFRESH_HOURS, analyzeSchedulerCapacity, type CapacityAnalysis } from "@/lib/business/priority"

export const maxDuration = 30

interface PriorityStats {
  priority: number | null
  total: number
  fresh: number
  staleActionable: number
  unavailable: number
  neverScraped: number
  stalenessThresholdHours: number | null
}

interface CostEstimate {
  dailyScrapes: number
  monthlyScrapes: number
  costPerScrape: number
  estimatedMonthlyCost: number
}

interface ScheduleOverview {
  cronSchedule: string
  cronDescription: string
  cronFrequencyMinutes: number
  runsPerHour: number
  nextRunEstimate: string | null
  activePriorities: readonly number[]
  priorityStats: PriorityStats[]
  totalProducts: number
  totalTracked: number
  totalStaleActionable: number
  totalUnavailable: number
  totalDueForScrape: number
  totalPhantomScraped: number
  costEstimate: CostEstimate
  capacity: CapacityAnalysis
}

const CRON_SCHEDULE = `*/${CRON_FREQUENCY_MINUTES} * * * *`
const CRON_DESCRIPTION = `Every ${CRON_FREQUENCY_MINUTES} minutes`

function getNextCronRun(): Date {
  const now = new Date()
  const currentMinutes = now.getUTCMinutes()

  const intervalsPassed = Math.floor(currentMinutes / CRON_FREQUENCY_MINUTES)
  const nextMinutes = (intervalsPassed + 1) * CRON_FREQUENCY_MINUTES

  const nextRun = new Date(now)
  nextRun.setUTCSeconds(0, 0)

  if (nextMinutes >= 60) {
    nextRun.setUTCHours(nextRun.getUTCHours() + 1)
    nextRun.setUTCMinutes(nextMinutes - 60)
  } else {
    nextRun.setUTCMinutes(nextMinutes)
  }

  return nextRun
}

function calculateDailyScrapes(priorityStats: PriorityStats[]): number {
  let dailyScrapes = 0

  for (const stat of priorityStats) {
    if (stat.priority === null || !(ACTIVE_PRIORITIES as readonly number[]).includes(stat.priority)) continue
    if (!stat.stalenessThresholdHours) continue

    const refreshDays = stat.stalenessThresholdHours / 24
    dailyScrapes += stat.total / refreshDays
  }

  return Math.ceil(dailyScrapes)
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get("action") || "overview"

    const supabase = createClient()
    const now = new Date()

    if (action === "overview") {
      const priorityRefreshConfig: Record<string, number | null> = {}
      for (const [priority, hours] of Object.entries(PRIORITY_REFRESH_HOURS)) {
        priorityRefreshConfig[priority] = hours
      }

      const { data: statsData, error: statsError } = await supabase.rpc("get_schedule_stats", {
        priority_refresh_hours: priorityRefreshConfig,
      })

      if (statsError) {
        console.error("Schedule stats RPC error:", statsError)
        return NextResponse.json(
          { error: "Failed to fetch schedule stats", details: statsError.message },
          { status: 500 },
        )
      }

      const priorityStats: PriorityStats[] = (statsData || []).map(
        (row: {
          priority: number | null
          total: number
          unavailable: number
          never_scraped: number
          fresh: number
          stale_actionable: number
          staleness_threshold_hours: number | null
        }) => ({
          priority: row.priority,
          total: Number(row.total),
          fresh: Number(row.fresh),
          staleActionable: Number(row.stale_actionable),
          unavailable: Number(row.unavailable),
          neverScraped: Number(row.never_scraped),
          stalenessThresholdHours: row.staleness_threshold_hours,
        }),
      )

      const totalProducts = priorityStats.reduce((sum, p) => sum + p.total, 0)
      const totalTracked = priorityStats
        .filter((p) => p.priority !== null && p.priority > 0)
        .reduce((sum, p) => sum + p.total, 0)
      const totalStaleActionable = priorityStats.reduce((sum, p) => sum + p.staleActionable, 0)
      const totalUnavailable = priorityStats.reduce((sum, p) => sum + p.unavailable, 0)
      const totalDueForScrape = priorityStats
        .filter((p) => p.priority !== null && (ACTIVE_PRIORITIES as readonly number[]).includes(p.priority))
        .reduce((sum, p) => sum + p.staleActionable, 0)

      let totalPhantomScraped = 0
      try {
        const { data, error } = await supabase.rpc("count_phantom_scraped_products", {
          active_priorities: [...ACTIVE_PRIORITIES],
        })
        if (!error && data !== null) {
          totalPhantomScraped = data
        }
      } catch (err) {
        console.error("Error calculating phantom scraped:", err)
      }

      const dailyScrapes = calculateDailyScrapes(priorityStats)
      const monthlyScrapes = dailyScrapes * 30
      const costEstimate: CostEstimate = {
        dailyScrapes,
        monthlyScrapes,
        costPerScrape: ESTIMATED_COST_PER_SCRAPE,
        estimatedMonthlyCost: Math.round(monthlyScrapes * ESTIMATED_COST_PER_SCRAPE * 100) / 100,
      }

      const productCountsByPriority: Record<number, number> = {}
      for (const stat of priorityStats) {
        if (stat.priority !== null) {
          productCountsByPriority[stat.priority] = stat.total
        }
      }
      const capacity = analyzeSchedulerCapacity(
        productCountsByPriority,
        WORKER_BATCH_SIZE,
        MAX_BATCHES_PER_RUN,
        CRON_FREQUENCY_MINUTES,
      )

      const overview: ScheduleOverview = {
        cronSchedule: CRON_SCHEDULE,
        cronDescription: CRON_DESCRIPTION,
        cronFrequencyMinutes: CRON_FREQUENCY_MINUTES,
        runsPerHour: 60 / CRON_FREQUENCY_MINUTES,
        nextRunEstimate: getNextCronRun().toISOString(),
        activePriorities: ACTIVE_PRIORITIES,
        priorityStats,
        totalProducts,
        totalTracked,
        totalStaleActionable,
        totalUnavailable,
        totalDueForScrape,
        totalPhantomScraped,
        costEstimate,
        capacity,
      }

      return NextResponse.json(overview)
    }

    if (action === "activity-log") {
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "50", 10)
      const offset = (page - 1) * limit

      const { count: totalCount, error: countError } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .not("updated_at", "is", null)

      if (countError) {
        console.error("Activity log count error:", countError)
      }

      const { data: products, error: productsError } = await supabase
        .from("store_products")
        .select("id, name, priority, origin_id, updated_at")
        .not("updated_at", "is", null)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (productsError) {
        console.error("Activity log products error:", productsError)
        return NextResponse.json({ error: "Failed to fetch products", details: productsError.message }, { status: 500 })
      }

      const totalPages = Math.ceil((totalCount || 0) / limit)

      return NextResponse.json({
        products: (products || []).map((p) => ({
          id: p.id,
          name: p.name,
          priority: p.priority,
          origin_id: p.origin_id,
          updated_at: p.updated_at!,
        })),
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages,
          hasMore: page < totalPages,
        },
      })
    }

    if (action === "products-by-staleness") {
      const priority = searchParams.get("priority")
      const status = searchParams.get("status") || "stale-actionable"
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "24", 10)
      const offset = (page - 1) * limit

      if (priority === null) {
        return NextResponse.json({ error: "Priority parameter is required" }, { status: 400 })
      }

      const priorityValue = priority === "null" ? null : parseInt(priority, 10)
      const thresholdHours = priorityValue !== null ? PRIORITY_REFRESH_HOURS[priorityValue] || null : null
      const cutoffTime = thresholdHours ? new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString() : null

      let query = supabase.from("store_products").select("*", { count: "exact" })

      if (priorityValue === null) {
        query = query.is("priority", null)
      } else {
        query = query.eq("priority", priorityValue)
      }

      if (status === "unavailable") {
        query = query.eq("available", false)
      } else if (status === "never-scraped") {
        query = query.is("updated_at", null)
      } else if (status === "fresh") {
        query = query.eq("available", true)
        if (cutoffTime) {
          query = query.gte("updated_at", cutoffTime)
        } else {
          query = query.not("updated_at", "is", null)
        }
      } else if (status === "stale-actionable") {
        query = query.eq("available", true)
        if (cutoffTime) {
          query = query.or(`updated_at.is.null,updated_at.lt.${cutoffTime}`)
        } else {
          query = query.is("updated_at", null)
        }
      }

      if (status === "phantom-scraped") {
        const { data: phantomData, error: phantomError } = await supabase.rpc("get_phantom_scraped_products", {
          active_priorities: [...ACTIVE_PRIORITIES],
          max_results: 10000,
        })

        if (phantomError) {
          console.error("Phantom scraped query error:", phantomError)
          return NextResponse.json(
            { error: "Failed to fetch phantom products", details: phantomError.message },
            { status: 500 },
          )
        }

        const phantomProducts = (phantomData || []) as { id: number }[]
        const phantomIds = phantomProducts.map((p) => p.id)

        if (phantomIds.length === 0) {
          return NextResponse.json({
            data: [],
            pagination: { page, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          })
        }

        const paginatedIds = phantomIds.slice(offset, offset + limit)
        const { data: products, error: productsError } = await supabase
          .from("store_products")
          .select("*")
          .in("id", paginatedIds)

        if (productsError) {
          console.error("Products fetch error:", productsError)
          return NextResponse.json(
            { error: "Failed to fetch products", details: productsError.message },
            { status: 500 },
          )
        }

        const totalPages = Math.ceil(phantomIds.length / limit)

        return NextResponse.json({
          data: products || [],
          pagination: {
            page,
            limit,
            totalCount: phantomIds.length,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        })
      }

      query = query.order("updated_at", { ascending: true, nullsFirst: true })
      query = query.range(offset, offset + limit - 1)

      const { data: products, error: productsError, count: totalCount } = await query

      if (productsError) {
        console.error("Products by staleness error:", productsError)
        return NextResponse.json({ error: "Failed to fetch products", details: productsError.message }, { status: 500 })
      }

      const totalPages = Math.ceil((totalCount || 0) / limit)

      return NextResponse.json({
        data: products || [],
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      })
    }

    if (action === "fix-phantom-scraped") {
      const { data, error: phantomError } = await supabase.rpc("get_phantom_scraped_products", {
        active_priorities: [...ACTIVE_PRIORITIES],
        max_results: 10000,
      })

      if (phantomError) {
        console.error("Error fetching phantom products:", phantomError)
        return NextResponse.json({ error: "Failed to query phantom products" }, { status: 500 })
      }

      const phantomProducts = (data || []) as {
        id: number
        name: string | null
        priority: number
        updated_at: string
      }[]

      if (phantomProducts.length === 0) {
        return NextResponse.json({ message: "No phantom scraped products found", fixed: 0 })
      }

      const dryRun = searchParams.get("dry") === "true"

      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          message: `Found ${phantomProducts.length} phantom scraped products`,
          wouldFix: phantomProducts.length,
          sampleProducts: phantomProducts.slice(0, 10).map((p) => ({
            id: p.id,
            name: p.name,
            priority: p.priority,
            updated_at: p.updated_at,
          })),
        })
      }

      const phantomIds = phantomProducts.map((p) => p.id)
      const { error: updateError } = await supabase
        .from("store_products")
        .update({ updated_at: null })
        .in("id", phantomIds)

      if (updateError) {
        console.error("Error resetting updated_at:", updateError)
        return NextResponse.json({ error: "Failed to reset updated_at" }, { status: 500 })
      }

      console.log(`[Schedule] Fixed ${phantomIds.length} phantom scraped products`)

      return NextResponse.json({
        message: `Reset updated_at for ${phantomIds.length} phantom scraped products`,
        fixed: phantomIds.length,
        productIds: phantomIds.slice(0, 50),
      })
    }

    if (action === "scrape-runs") {
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "50", 10)
      const offset = (page - 1) * limit

      const {
        data: runs,
        error: runsError,
        count,
      } = await supabase
        .from("scrape_runs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (runsError) {
        if (runsError.message.includes("does not exist")) {
          return NextResponse.json({
            runs: [],
            pagination: { page: 1, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            stats24h: {
              totalBatches: 0,
              totalProducts: 0,
              totalSuccess: 0,
              totalFailed: 0,
              successRate: 0,
              avgBatchDuration: 0,
            },
            migrationRequired: true,
          })
        }
        console.error("Scrape runs query error:", runsError)
        return NextResponse.json({ error: "Failed to fetch scrape runs", details: runsError.message }, { status: 500 })
      }

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentRuns } = await supabase
        .from("scrape_runs")
        .select("total, success, failed, duration_ms")
        .gte("started_at", oneDayAgo)

      const stats24h = (recentRuns || []).reduce(
        (acc, run) => ({
          totalBatches: acc.totalBatches + 1,
          totalProducts: acc.totalProducts + (run.total || 0),
          totalSuccess: acc.totalSuccess + (run.success || 0),
          totalFailed: acc.totalFailed + (run.failed || 0),
          totalDuration: acc.totalDuration + (run.duration_ms || 0),
        }),
        { totalBatches: 0, totalProducts: 0, totalSuccess: 0, totalFailed: 0, totalDuration: 0 },
      )

      const successRate =
        stats24h.totalProducts > 0 ? Math.round((stats24h.totalSuccess / stats24h.totalProducts) * 100) : 0

      return NextResponse.json({
        runs: runs || [],
        pagination: {
          page,
          limit,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNextPage: page < Math.ceil((count || 0) / limit),
          hasPreviousPage: page > 1,
        },
        stats24h: {
          ...stats24h,
          successRate,
          avgBatchDuration: stats24h.totalBatches > 0 ? Math.round(stats24h.totalDuration / stats24h.totalBatches) : 0,
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Schedule API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
