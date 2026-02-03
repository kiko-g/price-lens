import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ACTIVE_PRIORITIES, ESTIMATED_COST_PER_SCRAPE } from "@/lib/qstash"
import { PRIORITY_REFRESH_HOURS } from "@/lib/business/priority"

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

// Vercel cron schedule - hardcoded since vercel.json isn't accessible at runtime
const CRON_SCHEDULE = "*/30 * * * *"
const CRON_DESCRIPTION = "Every 30 minutes"
const CRON_FREQUENCY_MINUTES = 30

function getNextCronRun(): Date {
  const now = new Date()
  const currentMinutes = now.getUTCMinutes()

  // Find the next 30-minute mark (0 or 30)
  const nextMinutes = currentMinutes < 30 ? 30 : 60

  const nextRun = new Date(now)
  nextRun.setUTCSeconds(0, 0)

  if (nextMinutes === 60) {
    nextRun.setUTCHours(nextRun.getUTCHours() + 1)
    nextRun.setUTCMinutes(0)
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
      // Get counts by priority level using separate count queries (avoids 1000 row limit)
      const priorityStats: PriorityStats[] = []

      // Priority levels 5 down to 0, plus null
      const priorityLevels = [5, 4, 3, 2, 1, 0, null]

      for (const priority of priorityLevels) {
        const thresholdHours = priority !== null ? PRIORITY_REFRESH_HOURS[priority] || null : null
        const cutoffTime = thresholdHours
          ? new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString()
          : null

        // Build base query for this priority
        const baseFilter =
          priority === null
            ? supabase.from("store_products").select("id", { count: "exact", head: true }).is("priority", null)
            : supabase.from("store_products").select("id", { count: "exact", head: true }).eq("priority", priority)

        // Get total count
        const { count: total } = await baseFilter

        if (total === null || total === 0) {
          priorityStats.push({
            priority,
            total: 0,
            fresh: 0,
            staleActionable: 0,
            unavailable: 0,
            neverScraped: 0,
            stalenessThresholdHours: thresholdHours,
          })
          continue
        }

        // Get unavailable count (available = false)
        const unavailableQuery =
          priority === null
            ? supabase
                .from("store_products")
                .select("id", { count: "exact", head: true })
                .is("priority", null)
                .eq("available", false)
            : supabase
                .from("store_products")
                .select("id", { count: "exact", head: true })
                .eq("priority", priority)
                .eq("available", false)
        const { count: unavailable } = await unavailableQuery

        // Get never scraped count (updated_at is null) - informational, overlaps with other categories
        const neverScrapedQuery =
          priority === null
            ? supabase
                .from("store_products")
                .select("id", { count: "exact", head: true })
                .is("priority", null)
                .is("updated_at", null)
            : supabase
                .from("store_products")
                .select("id", { count: "exact", head: true })
                .eq("priority", priority)
                .is("updated_at", null)
        const { count: neverScraped } = await neverScrapedQuery

        // Calculate fresh and staleActionable for AVAILABLE products only
        const availableTotal = total - (unavailable ?? 0)
        let fresh = 0
        let staleActionable = 0

        if (availableTotal > 0) {
          if (cutoffTime) {
            // Fresh = available AND updated_at >= cutoffTime
            const freshQuery =
              priority === null
                ? supabase
                    .from("store_products")
                    .select("id", { count: "exact", head: true })
                    .is("priority", null)
                    .eq("available", true)
                    .gte("updated_at", cutoffTime)
                : supabase
                    .from("store_products")
                    .select("id", { count: "exact", head: true })
                    .eq("priority", priority)
                    .eq("available", true)
                    .gte("updated_at", cutoffTime)
            const { count: freshCount } = await freshQuery
            fresh = freshCount ?? 0

            // Stale actionable = available - fresh
            staleActionable = availableTotal - fresh
          } else {
            // No threshold = all available scraped products are "fresh", never scraped available are "stale"
            const neverScrapedAvailableQuery =
              priority === null
                ? supabase
                    .from("store_products")
                    .select("id", { count: "exact", head: true })
                    .is("priority", null)
                    .eq("available", true)
                    .is("updated_at", null)
                : supabase
                    .from("store_products")
                    .select("id", { count: "exact", head: true })
                    .eq("priority", priority)
                    .eq("available", true)
                    .is("updated_at", null)
            const { count: neverScrapedAvailable } = await neverScrapedAvailableQuery
            staleActionable = neverScrapedAvailable ?? 0
            fresh = availableTotal - staleActionable
          }
        }

        priorityStats.push({
          priority,
          total,
          fresh,
          staleActionable,
          unavailable: unavailable ?? 0,
          neverScraped: neverScraped ?? 0,
          stalenessThresholdHours: thresholdHours,
        })
      }

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

      const { data: products } = await supabase
        .from("store_products")
        .select("id, priority, updated_at")
        .in("priority", ACTIVE_PRIORITIES)

      if (!products) {
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
      // Show recent scraping activity - products updated recently
      const timeWindows = [
        { label: "Last 30 minutes", hours: 0.5 },
        { label: "Last hour", hours: 1 },
        { label: "Last 6 hours", hours: 6 },
        { label: "Last 24 hours", hours: 24 },
      ]

      const activityData: {
        windows: { label: string; count: number; byPriority: Record<number, number> }[]
        scrapesPerHour: number
      } = {
        windows: [],
        scrapesPerHour: 0,
      }

      for (const window of timeWindows) {
        const cutoff = new Date(now.getTime() - window.hours * 60 * 60 * 1000).toISOString()

        const { data: products } = await supabase
          .from("store_products")
          .select("id, priority")
          .gte("updated_at", cutoff)

        const byPriority: Record<number, number> = {}
        for (const p of [5, 4, 3, 2, 1, 0]) {
          byPriority[p] = 0
        }

        if (products) {
          for (const p of products) {
            if (p.priority !== null) {
              byPriority[p.priority] = (byPriority[p.priority] || 0) + 1
            }
          }
        }

        activityData.windows.push({
          label: window.label,
          count: products?.length || 0,
          byPriority,
        })
      }

      // Calculate scrapes per hour based on last hour
      const lastHourWindow = activityData.windows.find((w) => w.label === "Last hour")
      activityData.scrapesPerHour = lastHourWindow?.count || 0

      return NextResponse.json(activityData)
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Schedule API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
