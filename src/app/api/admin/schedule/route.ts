import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchAll } from "@/lib/supabase/fetch-all"
import {
  ACTIVE_PRIORITIES,
  ESTIMATED_COST_PER_SCRAPE,
  WORKER_BATCH_SIZE,
  MAX_BATCHES_PER_RUN,
  CRON_FREQUENCY_MINUTES,
  qstash,
  getBaseUrl,
} from "@/lib/qstash"
import { PRIORITY_REFRESH_HOURS, analyzeSchedulerCapacity, type CapacityAnalysis } from "@/lib/business/priority"

export const maxDuration = 30

interface PriorityStats {
  priority: number | null
  total: number
  fresh: number // available=true AND recently scraped
  staleActionable: number // available=true AND needs scraping (we can fix this)
  unavailable: number // available=false (not our problem)
  neverScraped: number // updated_at IS NULL (informational, overlaps with other categories)
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
  totalStaleActionable: number // Products that need scraping and are available
  totalUnavailable: number // Products that are unavailable (can't be scraped)
  totalDueForScrape: number
  totalPhantomScraped: number // Products that appear scraped (have updated_at) but have no price records
  costEstimate: CostEstimate
  capacity: CapacityAnalysis
}

interface TimelineProduct {
  id: number
  name: string | null
  priority: number
  origin_id: number | null
  updated_at: string | null
  staleAt: string | null
  hoursUntilStale: number | null
  isStale: boolean
}

interface TimelineData {
  date: string
  hourlyBuckets: {
    hour: number
    products: TimelineProduct[]
  }[]
}

// Vercel cron schedule description (actual frequency comes from CRON_FREQUENCY_MINUTES)
const CRON_SCHEDULE = `*/${CRON_FREQUENCY_MINUTES} * * * *`
const CRON_DESCRIPTION = `Every ${CRON_FREQUENCY_MINUTES} minutes`

function getNextCronRun(): Date {
  const now = new Date()
  const currentMinutes = now.getUTCMinutes()

  // Find the next cron interval mark based on CRON_FREQUENCY_MINUTES
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

    // Products per day = total products / refresh period in days
    const refreshDays = stat.stalenessThresholdHours / 24
    dailyScrapes += stat.total / refreshDays
  }

  return Math.ceil(dailyScrapes)
}

function calculateStaleTime(updatedAt: string | null, priority: number): { staleAt: Date | null; isStale: boolean } {
  if (!updatedAt) return { staleAt: null, isStale: true }

  const thresholdHours = PRIORITY_REFRESH_HOURS[priority]
  if (!thresholdHours) return { staleAt: null, isStale: false }

  const updated = new Date(updatedAt)
  const staleAt = new Date(updated.getTime() + thresholdHours * 60 * 60 * 1000)
  const isStale = staleAt <= new Date()

  return { staleAt, isStale }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get("action") || "overview"
    const date = searchParams.get("date") // For timeline: YYYY-MM-DD

    const supabase = createClient()
    const now = new Date()

    if (action === "overview") {
      // Build priority refresh hours config for the RPC
      const priorityRefreshConfig: Record<string, number | null> = {}
      for (const [priority, hours] of Object.entries(PRIORITY_REFRESH_HOURS)) {
        priorityRefreshConfig[priority] = hours
      }

      // Single RPC call replaces 28-35 sequential queries
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

      // Map RPC results to expected format
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

      // Calculate phantom scraped products (have updated_at but no price records)
      // This is a data integrity issue we need to surface
      // Uses database function for efficient counting without row limits
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

      // Calculate cost estimate
      const dailyScrapes = calculateDailyScrapes(priorityStats)
      const monthlyScrapes = dailyScrapes * 30
      const costEstimate: CostEstimate = {
        dailyScrapes,
        monthlyScrapes,
        costPerScrape: ESTIMATED_COST_PER_SCRAPE,
        estimatedMonthlyCost: Math.round(monthlyScrapes * ESTIMATED_COST_PER_SCRAPE * 100) / 100,
      }

      // Calculate capacity analysis
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

    if (action === "timeline") {
      // Get products that will become stale on a specific date
      const targetDate = date ? new Date(date) : now
      targetDate.setUTCHours(0, 0, 0, 0)

      const endOfDay = new Date(targetDate)
      endOfDay.setUTCHours(23, 59, 59, 999)

      // Only fetch products from active priorities that have been scraped
      const { data: products } = await supabase
        .from("store_products")
        .select("id, name, priority, origin_id, updated_at")
        .in("priority", ACTIVE_PRIORITIES)
        .not("updated_at", "is", null)
        .order("updated_at", { ascending: true })
        .limit(1000)

      if (!products) {
        return NextResponse.json({ date: targetDate.toISOString().split("T")[0], hourlyBuckets: [] })
      }

      // Group products by the hour they become stale
      const hourlyBuckets: Map<number, TimelineProduct[]> = new Map()

      for (let h = 0; h < 24; h++) {
        hourlyBuckets.set(h, [])
      }

      for (const product of products) {
        if (!product.priority || !product.updated_at) continue

        const { staleAt, isStale } = calculateStaleTime(product.updated_at, product.priority)

        if (!staleAt) continue

        // Check if staleAt falls on the target date
        if (staleAt >= targetDate && staleAt <= endOfDay) {
          const hour = staleAt.getUTCHours()
          const hoursUntilStale = Math.round((staleAt.getTime() - now.getTime()) / (60 * 60 * 1000))

          hourlyBuckets.get(hour)?.push({
            id: product.id,
            name: product.name,
            priority: product.priority,
            origin_id: product.origin_id,
            updated_at: product.updated_at,
            staleAt: staleAt.toISOString(),
            hoursUntilStale,
            isStale,
          })
        }
      }

      const timeline: TimelineData = {
        date: targetDate.toISOString().split("T")[0],
        hourlyBuckets: Array.from(hourlyBuckets.entries()).map(([hour, products]) => ({
          hour,
          products,
        })),
      }

      return NextResponse.json(timeline)
    }

    if (action === "stale-breakdown") {
      // Get detailed breakdown of stale products by hours overdue
      const buckets = [
        { label: "Never scraped", min: null, max: null },
        { label: "0-6 hours overdue", min: 0, max: 6 },
        { label: "6-24 hours overdue", min: 6, max: 24 },
        { label: "1-3 days overdue", min: 24, max: 72 },
        { label: "3-7 days overdue", min: 72, max: 168 },
        { label: "7+ days overdue", min: 168, max: Infinity },
      ]

      const { data: products, error: productsError } = await fetchAll(() =>
        supabase
          .from("store_products")
          .select("id, priority, updated_at")
          .in("priority", ACTIVE_PRIORITIES),
      )

      if (productsError || !products.length) {
        if (productsError) console.error("Stale breakdown query error:", productsError)
        return NextResponse.json({ buckets: [] })
      }

      const breakdown = buckets.map((bucket) => ({
        ...bucket,
        count: 0,
        byPriority: {} as Record<number, number>,
      }))

      // Initialize byPriority for all active priorities
      for (const bucket of breakdown) {
        for (const p of ACTIVE_PRIORITIES) {
          bucket.byPriority[p] = 0
        }
      }

      for (const product of products) {
        if (!product.priority) continue

        const thresholdHours = PRIORITY_REFRESH_HOURS[product.priority]
        if (!thresholdHours) continue

        if (!product.updated_at) {
          // Never scraped
          breakdown[0].count++
          breakdown[0].byPriority[product.priority]++
          continue
        }

        const updated = new Date(product.updated_at)
        const staleAt = new Date(updated.getTime() + thresholdHours * 60 * 60 * 1000)
        const hoursOverdue = (now.getTime() - staleAt.getTime()) / (60 * 60 * 1000)

        if (hoursOverdue < 0) continue // Not stale yet

        // Find the right bucket
        for (let i = 1; i < breakdown.length; i++) {
          const bucket = breakdown[i]
          if (bucket.min !== null && bucket.max !== null) {
            if (hoursOverdue >= bucket.min && hoursOverdue < bucket.max) {
              bucket.count++
              bucket.byPriority[product.priority]++
              break
            }
          }
        }
      }

      return NextResponse.json({ buckets: breakdown })
    }

    if (action === "activity") {
      // Use RPC to get aggregated counts — avoids Supabase's 1000-row default limit
      const { data: rpcResult, error: rpcError } = await supabase.rpc("get_activity_window_stats")

      if (rpcError) {
        console.error("Activity stats RPC error:", rpcError)
        return NextResponse.json({ error: "Failed to fetch activity stats" }, { status: 500 })
      }

      const raw = rpcResult as {
        windows: { label: string; byPriority: Record<string, number>; total: number }[]
      }

      const windows = raw.windows.map((w) => {
        // Normalize byPriority: RPC uses -1 for null priority, convert to 0-5 keys
        const byPriority: Record<number, number> = {}
        for (const p of [5, 4, 3, 2, 1, 0]) {
          byPriority[p] = 0
        }
        for (const [key, count] of Object.entries(w.byPriority)) {
          const priority = Number(key)
          if (priority >= 0 && priority <= 5) {
            byPriority[priority] = count
          }
        }
        return { label: w.label, count: w.total, byPriority }
      })

      const lastHourWindow = windows.find((w) => w.label === "Last hour")

      return NextResponse.json({
        windows,
        scrapesPerHour: lastHourWindow?.count || 0,
      })
    }

    if (action === "activity-log") {
      // Paginated activity log of recently scraped products
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "50", 10)
      const offset = (page - 1) * limit

      // Get total count of scraped products
      const { count: totalCount, error: countError } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .not("updated_at", "is", null)

      if (countError) {
        console.error("Activity log count error:", countError)
      }

      // Get paginated products - using only columns we know exist
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
      // Fetch products filtered by priority and staleness status
      const priority = searchParams.get("priority")
      const status = searchParams.get("status") || "stale-actionable" // stale-actionable | never-scraped | fresh | unavailable
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "24", 10)
      const offset = (page - 1) * limit

      if (priority === null) {
        return NextResponse.json({ error: "Priority parameter is required" }, { status: 400 })
      }

      const priorityValue = priority === "null" ? null : parseInt(priority, 10)
      const thresholdHours = priorityValue !== null ? PRIORITY_REFRESH_HOURS[priorityValue] || null : null
      const cutoffTime = thresholdHours ? new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString() : null

      // Build base query for products
      let query = supabase.from("store_products").select("*", { count: "exact" })

      // Apply priority filter
      if (priorityValue === null) {
        query = query.is("priority", null)
      } else {
        query = query.eq("priority", priorityValue)
      }

      // Apply staleness filter based on status
      if (status === "unavailable") {
        // Products that are not available (can't be scraped)
        query = query.eq("available", false)
      } else if (status === "never-scraped") {
        // Products never scraped (informational - includes both available and unavailable)
        query = query.is("updated_at", null)
      } else if (status === "fresh") {
        // Fresh = available AND recently scraped
        query = query.eq("available", true)
        if (cutoffTime) {
          query = query.gte("updated_at", cutoffTime)
        } else {
          // No threshold = all scraped available products are fresh
          query = query.not("updated_at", "is", null)
        }
      } else if (status === "stale-actionable") {
        // Stale actionable = available AND needs scraping
        query = query.eq("available", true)
        if (cutoffTime) {
          query = query.or(`updated_at.is.null,updated_at.lt.${cutoffTime}`)
        } else {
          // No threshold means only never scraped are "stale"
          query = query.is("updated_at", null)
        }
      }
      // If status is "all" or anything else, we just get all products for this priority

      // Handle phantom-scraped status separately using RPC
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
            pagination: {
              page,
              limit,
              totalCount: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          })
        }

        // Fetch full product data for the paginated subset
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

      // Order by updated_at (never scraped first, then oldest)
      query = query.order("updated_at", { ascending: true, nullsFirst: true })

      // Apply pagination
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
      // Find and fix "phantom scraped" products - they have updated_at set but no price records
      // This is a data integrity issue where products appear "fresh" but have no actual price data
      // Fix: Reset their updated_at to NULL so the scheduler picks them up

      // Use database function to get phantom product IDs efficiently
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
        return NextResponse.json({
          message: "No phantom scraped products found",
          fixed: 0,
        })
      }

      // Check if this is a dry run
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

      // Step 4: Reset updated_at to NULL for these products
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
        productIds: phantomIds.slice(0, 50), // Return first 50 IDs for reference
      })
    }

    if (action === "scrape-runs") {
      const page = parseInt(searchParams.get("page") || "1", 10)
      const limit = parseInt(searchParams.get("limit") || "50", 10)
      const offset = (page - 1) * limit

      const { data: runs, error: runsError, count } = await supabase
        .from("scrape_runs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (runsError) {
        // Table might not exist yet (migration not applied)
        if (runsError.message.includes("does not exist")) {
          return NextResponse.json({
            runs: [],
            pagination: { page: 1, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
            stats24h: { totalBatches: 0, totalProducts: 0, totalSuccess: 0, totalFailed: 0, successRate: 0, avgBatchDuration: 0 },
            migrationRequired: true,
          })
        }
        console.error("Scrape runs query error:", runsError)
        return NextResponse.json(
          { error: "Failed to fetch scrape runs", details: runsError.message },
          { status: 500 },
        )
      }

      // Calculate aggregate stats from last 24 hours
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

      const successRate = stats24h.totalProducts > 0
        ? Math.round((stats24h.totalSuccess / stats24h.totalProducts) * 100)
        : 0

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
          avgBatchDuration: stats24h.totalBatches > 0
            ? Math.round(stats24h.totalDuration / stats24h.totalBatches)
            : 0,
        },
      })
    }

    if (action === "qstash-schedules") {
      try {
        const schedules = await qstash.schedules.list()
        const schedulerPath = "/api/scrape/scheduler"
        const relevantSchedules = schedules.filter((s) => s.destination.includes(schedulerPath))
        return NextResponse.json({
          schedules: relevantSchedules.map((s) => ({
            scheduleId: s.scheduleId,
            cron: s.cron,
            destination: s.destination,
            isPaused: s.isPaused,
            createdAt: s.createdAt,
            method: s.method,
            retries: s.retries,
          })),
          total: relevantSchedules.length,
        })
      } catch (err) {
        console.error("QStash schedules error:", err)
        return NextResponse.json(
          { error: "Failed to list QStash schedules", details: err instanceof Error ? err.message : "Unknown" },
          { status: 500 },
        )
      }
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body as { action: string }

    if (action === "create-qstash-cron") {
      const { cron } = body as { cron?: string }
      const cronExpression = cron || `*/${CRON_FREQUENCY_MINUTES} * * * *`
      const baseUrl = getBaseUrl()
      const destination = `${baseUrl}/api/scrape/scheduler`

      try {
        const result = await qstash.schedules.create({
          destination,
          cron: cronExpression,
          method: "GET",
          retries: 2,
        })

        console.log(`[Admin] Created QStash cron schedule: ${result.scheduleId} (${cronExpression})`)
        return NextResponse.json({
          message: `Created QStash cron schedule`,
          scheduleId: result.scheduleId,
          cron: cronExpression,
          destination,
        })
      } catch (err) {
        console.error("QStash create schedule error:", err)
        return NextResponse.json(
          { error: "Failed to create QStash schedule", details: err instanceof Error ? err.message : "Unknown" },
          { status: 500 },
        )
      }
    }

    if (action === "delete-qstash-cron") {
      const { scheduleId } = body as { scheduleId: string }
      if (!scheduleId) {
        return NextResponse.json({ error: "scheduleId is required" }, { status: 400 })
      }

      try {
        await qstash.schedules.delete(scheduleId)
        console.log(`[Admin] Deleted QStash cron schedule: ${scheduleId}`)
        return NextResponse.json({ message: `Deleted schedule ${scheduleId}` })
      } catch (err) {
        console.error("QStash delete schedule error:", err)
        return NextResponse.json(
          { error: "Failed to delete QStash schedule", details: err instanceof Error ? err.message : "Unknown" },
          { status: 500 },
        )
      }
    }

    if (action === "pause-qstash-cron") {
      const { scheduleId } = body as { scheduleId: string }
      if (!scheduleId) {
        return NextResponse.json({ error: "scheduleId is required" }, { status: 400 })
      }

      try {
        await qstash.schedules.pause({ schedule: scheduleId })
        console.log(`[Admin] Paused QStash cron schedule: ${scheduleId}`)
        return NextResponse.json({ message: `Paused schedule ${scheduleId}` })
      } catch (err) {
        console.error("QStash pause schedule error:", err)
        return NextResponse.json(
          { error: "Failed to pause QStash schedule", details: err instanceof Error ? err.message : "Unknown" },
          { status: 500 },
        )
      }
    }

    if (action === "resume-qstash-cron") {
      const { scheduleId } = body as { scheduleId: string }
      if (!scheduleId) {
        return NextResponse.json({ error: "scheduleId is required" }, { status: 400 })
      }

      try {
        await qstash.schedules.resume({ schedule: scheduleId })
        console.log(`[Admin] Resumed QStash cron schedule: ${scheduleId}`)
        return NextResponse.json({ message: `Resumed schedule ${scheduleId}` })
      } catch (err) {
        console.error("QStash resume schedule error:", err)
        return NextResponse.json(
          { error: "Failed to resume QStash schedule", details: err instanceof Error ? err.message : "Unknown" },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Schedule API POST error:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
