import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PRIORITY_STALENESS_HOURS } from "@/lib/qstash"

export const maxDuration = 30

interface PriorityStats {
  priority: number | null
  total: number
  stale: number
  fresh: number
  neverScraped: number
  stalenessThresholdHours: number | null
}

interface ScheduleOverview {
  cronSchedule: string
  cronDescription: string
  nextRunEstimate: string | null
  activePriorities: number[]
  priorityStats: PriorityStats[]
  totalProducts: number
  totalTracked: number
  totalStale: number
  totalDueForScrape: number
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
const CRON_SCHEDULE = "0 6 * * *"
const CRON_DESCRIPTION = "Daily at 6:00 AM UTC"

// Priorities that the scheduler actually processes
const ACTIVE_PRIORITIES = [5, 4, 3]

function getNextCronRun(): Date {
  const now = new Date()
  const nextRun = new Date(now)
  nextRun.setUTCHours(6, 0, 0, 0)

  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1)
  }

  return nextRun
}

function calculateStaleTime(updatedAt: string | null, priority: number): { staleAt: Date | null; isStale: boolean } {
  if (!updatedAt) return { staleAt: null, isStale: true }

  const thresholdHours = PRIORITY_STALENESS_HOURS[priority]
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
        const thresholdHours = priority !== null ? (PRIORITY_STALENESS_HOURS[priority] || null) : null
        const cutoffTime = thresholdHours
          ? new Date(now.getTime() - thresholdHours * 60 * 60 * 1000).toISOString()
          : null

        // Build base query for this priority
        const baseFilter = priority === null
          ? supabase.from("store_products").select("id", { count: "exact", head: true }).is("priority", null)
          : supabase.from("store_products").select("id", { count: "exact", head: true }).eq("priority", priority)

        // Get total count
        const { count: total } = await baseFilter

        if (total === null || total === 0) {
          priorityStats.push({
            priority,
            total: 0,
            stale: 0,
            fresh: 0,
            neverScraped: 0,
            stalenessThresholdHours: thresholdHours,
          })
          continue
        }

        // Get never scraped count (updated_at is null)
        const neverScrapedQuery = priority === null
          ? supabase.from("store_products").select("id", { count: "exact", head: true }).is("priority", null).is("updated_at", null)
          : supabase.from("store_products").select("id", { count: "exact", head: true }).eq("priority", priority).is("updated_at", null)
        const { count: neverScraped } = await neverScrapedQuery

        let stale = neverScraped ?? 0
        let fresh = 0

        if (cutoffTime) {
          // Get stale count (updated_at < cutoffTime, excluding never scraped)
          const staleQuery = priority === null
            ? supabase.from("store_products").select("id", { count: "exact", head: true }).is("priority", null).not("updated_at", "is", null).lt("updated_at", cutoffTime)
            : supabase.from("store_products").select("id", { count: "exact", head: true }).eq("priority", priority).not("updated_at", "is", null).lt("updated_at", cutoffTime)
          const { count: staleCount } = await staleQuery
          stale += staleCount ?? 0

          // Fresh = total - stale
          fresh = total - stale
        } else {
          // No threshold = everything scraped is "fresh"
          fresh = total - stale
        }

        priorityStats.push({
          priority,
          total,
          stale,
          fresh,
          neverScraped: neverScraped ?? 0,
          stalenessThresholdHours: thresholdHours,
        })
      }

      const totalProducts = priorityStats.reduce((sum, p) => sum + p.total, 0)
      const totalTracked = priorityStats
        .filter((p) => p.priority !== null && p.priority > 0)
        .reduce((sum, p) => sum + p.total, 0)
      const totalStale = priorityStats.reduce((sum, p) => sum + p.stale, 0)
      const totalDueForScrape = priorityStats
        .filter((p) => ACTIVE_PRIORITIES.includes(p.priority as number))
        .reduce((sum, p) => sum + p.stale, 0)

      const overview: ScheduleOverview = {
        cronSchedule: CRON_SCHEDULE,
        cronDescription: CRON_DESCRIPTION,
        nextRunEstimate: getNextCronRun().toISOString(),
        activePriorities: ACTIVE_PRIORITIES,
        priorityStats,
        totalProducts,
        totalTracked,
        totalStale,
        totalDueForScrape,
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
        byPriority: { 5: 0, 4: 0, 3: 0 } as Record<number, number>,
      }))

      for (const product of products) {
        if (!product.priority) continue

        const thresholdHours = PRIORITY_STALENESS_HOURS[product.priority]
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Schedule API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
