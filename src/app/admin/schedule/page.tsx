"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns"

import { Layout } from "@/components/layout"
import { HideFooter } from "@/contexts/FooterContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ZapIcon,
  TrendingUpIcon,
  TimerIcon,
  InfoIcon,
  DollarSignIcon,
  ActivityIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PriorityStats {
  priority: number | null
  total: number
  stale: number
  fresh: number
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
  cronFrequencyHours: number
  nextRunEstimate: string | null
  activePriorities: number[]
  priorityStats: PriorityStats[]
  totalProducts: number
  totalTracked: number
  totalStale: number
  totalDueForScrape: number
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

interface StaleBreakdown {
  buckets: {
    label: string
    min: number | null
    max: number | null
    count: number
    byPriority: Record<number, number>
  }[]
}

const PRIORITY_CONFIG: Record<number, { name: string; color: string; bgColor: string }> = {
  5: { name: "Premium", color: "text-purple-500", bgColor: "bg-purple-500" },
  4: { name: "High", color: "text-blue-500", bgColor: "bg-blue-500" },
  3: { name: "Medium", color: "text-emerald-500", bgColor: "bg-emerald-500" },
  2: { name: "Low", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  1: { name: "Minimal", color: "text-orange-500", bgColor: "bg-orange-500" },
  0: { name: "None", color: "text-gray-500", bgColor: "bg-gray-500" },
}

function formatThreshold(hours: number | null): string {
  if (hours === null) return "—"
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return days === 1 ? "1 day" : `${days} days`
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEE, MMM d")
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Fetch overview data
  const {
    data: overview,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["schedule-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=overview")
      return res.data as ScheduleOverview
    },
    staleTime: 60000,
  })

  // Fetch timeline data for selected date
  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["schedule-timeline", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/schedule?action=timeline&date=${format(selectedDate, "yyyy-MM-dd")}`)
      return res.data as TimelineData
    },
    staleTime: 60000,
  })

  // Fetch stale breakdown
  const { data: staleBreakdown, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ["schedule-stale-breakdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=stale-breakdown")
      return res.data as StaleBreakdown
    },
    staleTime: 60000,
  })

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => (direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)))
  }

  // Calculate max products in any hour for scaling the timeline bars
  const maxProductsInHour = useMemo(() => {
    if (!timeline) return 0
    return Math.max(...timeline.hourlyBuckets.map((b) => b.products.length), 1)
  }, [timeline])

  // Get time until next cron run
  const timeUntilNextRun = useMemo(() => {
    if (!overview?.nextRunEstimate) return null
    const next = new Date(overview.nextRunEstimate)
    const now = new Date()
    const diffMs = next.getTime() - now.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes }
  }, [overview?.nextRunEstimate])

  return (
    <Layout>
      <HideFooter />
      <div className="flex h-[calc(100dvh-54px)] flex-col overflow-hidden lg:flex-row">
        {/* Sidebar - Schedule Overview */}
        <aside className="flex h-auto min-h-0 flex-col border-b lg:h-full lg:w-80 lg:min-w-80 lg:shrink-0 lg:border-r lg:border-b-0">
          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center gap-2">
              <CalendarIcon className="text-primary size-5" />
              <h2 className="text-lg font-bold">Scrape Schedule</h2>
            </div>

            {/* Cron Schedule */}
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
                <ClockIcon className="h-3.5 w-3.5" />
                Cron Schedule
              </div>
              {isLoadingOverview ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                <>
                  <p className="text-xl font-bold">{overview?.cronDescription}</p>
                  <p className="text-muted-foreground font-mono text-xs">{overview?.cronSchedule}</p>
                </>
              )}
            </div>

            {/* Next Run */}
            <div className="mt-4 space-y-1 border-t pt-4">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase">
                <TimerIcon className="h-3.5 w-3.5" />
                Next Run
              </div>
              {isLoadingOverview ? (
                <Skeleton className="h-7 w-24" />
              ) : timeUntilNextRun ? (
                <>
                  <p className="text-xl font-bold">
                    {timeUntilNextRun.hours}h {timeUntilNextRun.minutes}m
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {overview?.nextRunEstimate && format(new Date(overview.nextRunEstimate), "MMM d, HH:mm 'UTC'")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
              {/* Due for Scrape */}
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <ZapIcon className="h-3 w-3" />
                  Due for Scrape
                </div>
                {isLoadingOverview ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="mt-1 text-lg font-bold text-amber-500">
                    {overview?.totalDueForScrape.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Daily Scrapes */}
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <ActivityIcon className="h-3 w-3" />
                  Daily Scrapes
                </div>
                {isLoadingOverview ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="mt-1 text-lg font-bold">{overview?.costEstimate.dailyScrapes.toLocaleString()}</p>
                )}
              </div>

              {/* Monthly Scrapes */}
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <TrendingUpIcon className="h-3 w-3" />
                  Monthly
                </div>
                {isLoadingOverview ? (
                  <Skeleton className="mt-1 h-6 w-16" />
                ) : (
                  <p className="mt-1 text-lg font-bold">~{overview?.costEstimate.monthlyScrapes.toLocaleString()}</p>
                )}
              </div>

              {/* Est. Cost */}
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <DollarSignIcon className="h-3 w-3" />
                  Est. Cost/mo
                </div>
                {isLoadingOverview ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="mt-1 text-lg font-bold text-emerald-500">
                    ${overview?.costEstimate.estimatedMonthlyCost.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Active Priorities */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="text-muted-foreground text-xs font-medium uppercase">Active Priorities</div>
              {isLoadingOverview ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {overview?.activePriorities.map((p) => (
                      <Badge key={p} className={cn("text-white", PRIORITY_CONFIG[p]?.bgColor)}>
                        {PRIORITY_CONFIG[p]?.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Priority 1-2 not scheduled
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="ml-1 inline h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            90% of products are at priority 1 as a safety measure. Scheduling them would overwhelm the
                            system.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                </>
              )}
            </div>

            {/* Info Section */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="text-muted-foreground flex items-start gap-2 text-xs">
                <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                <div className="space-y-2">
                  <p>
                    <strong>Cron:</strong> Runs daily at 6:00 AM UTC via Vercel, queuing stale products to QStash.
                  </p>
                  <p>
                    <strong>Thresholds:</strong> Premium 24h, High 48h, Medium 72h, Low 168h, Minimal 336h.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Refresh Button */}
          <div className="bg-background shrink-0 border-t p-4">
            <Button variant="outline" size="sm" onClick={() => refetchOverview()} className="w-full">
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
                <CardDescription>Product count and staleness by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overview?.priorityStats
                      .filter((s) => s.priority !== null)
                      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                      .map((stat) => {
                        const config = PRIORITY_CONFIG[stat.priority ?? 0]
                        const isActive = overview.activePriorities.includes(stat.priority ?? 0)
                        const stalePercent = stat.total > 0 ? Math.round((stat.stale / stat.total) * 100) : 0
                        const freshPercent = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0

                        return (
                          <div key={stat.priority} className={cn("rounded-lg border p-4", !isActive && "opacity-50")}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={cn("h-3 w-3 rounded-full", config?.bgColor)} />
                                <span className="font-medium">{config?.name}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({stat.total.toLocaleString()} products)
                                </span>
                                {!isActive && (
                                  <Badge variant="outline" className="text-muted-foreground text-xs">
                                    Not scheduled
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Refresh: {formatThreshold(stat.stalenessThresholdHours)}
                                </span>
                              </div>
                            </div>

                            {/* Stale/Fresh bar */}
                            <div className="flex h-6 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                              {stat.stale > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="flex items-center justify-center bg-red-500 text-xs font-medium text-white transition-all"
                                        style={{ width: `${stalePercent}%` }}
                                      >
                                        {stalePercent > 10 && `${stat.stale.toLocaleString()}`}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {stat.stale.toLocaleString()} stale ({stalePercent}%)
                                      </p>
                                      {stat.neverScraped > 0 && (
                                        <p className="text-muted-foreground text-xs">
                                          Including {stat.neverScraped.toLocaleString()} never scraped
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {stat.fresh > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                                        style={{ width: `${freshPercent}%` }}
                                      >
                                        {freshPercent > 10 && `${stat.fresh.toLocaleString()}`}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                              <span className="flex items-center gap-1 text-red-500">
                                <AlertTriangleIcon className="h-3 w-3" />
                                {stat.stale.toLocaleString()} stale
                              </span>
                              <span className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2Icon className="h-3 w-3" />
                                {stat.fresh.toLocaleString()} fresh
                              </span>
                              {stat.neverScraped > 0 && (
                                <span className="text-muted-foreground">
                                  ({stat.neverScraped.toLocaleString()} never scraped)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}

                    {/* Null priority section */}
                    {overview?.priorityStats.find((s) => s.priority === null) && (
                      <div className="rounded-lg border border-dashed p-4 opacity-50">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-gray-300" />
                          <span className="font-medium">Unclassified</span>
                          <span className="text-muted-foreground text-sm">
                            ({overview.priorityStats.find((s) => s.priority === null)?.total.toLocaleString()} products)
                          </span>
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Not scheduled
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline / Gantt View */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Staleness Timeline</CardTitle>
                    <CardDescription>Products becoming stale throughout the day</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                      disabled={isToday(selectedDate)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateLabel(selectedDate)}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTimeline ? (
                  <div className="space-y-2">
                    {[...Array(12)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {timeline?.hourlyBuckets.map((bucket) => {
                      const barWidth = maxProductsInHour > 0 ? (bucket.products.length / maxProductsInHour) * 100 : 0
                      const hasProducts = bucket.products.length > 0

                      // Group by priority for the tooltip
                      const byPriority = bucket.products.reduce(
                        (acc, p) => {
                          acc[p.priority] = (acc[p.priority] || 0) + 1
                          return acc
                        },
                        {} as Record<number, number>,
                      )

                      return (
                        <div key={bucket.hour} className="group flex items-center gap-2">
                          <span className="text-muted-foreground w-12 text-right font-mono text-xs">
                            {bucket.hour.toString().padStart(2, "0")}:00
                          </span>
                          <div className="bg-muted/30 relative h-6 flex-1 overflow-hidden rounded">
                            {hasProducts && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="absolute top-0 left-0 h-full rounded bg-linear-to-r from-indigo-500 to-teal-500 transition-all group-hover:opacity-80"
                                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-sm">
                                    <p className="font-medium">{bucket.products.length} products become stale</p>
                                    <div className="mt-1 space-y-1 text-xs">
                                      {Object.entries(byPriority)
                                        .sort(([a], [b]) => Number(b) - Number(a))
                                        .map(([priority, count]) => (
                                          <div key={priority} className="flex items-center gap-1">
                                            <span
                                              className={cn(
                                                "h-2 w-2 rounded-full",
                                                PRIORITY_CONFIG[Number(priority)]?.bgColor,
                                              )}
                                            />
                                            <span>
                                              {PRIORITY_CONFIG[Number(priority)]?.name}: {count}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <span className="text-muted-foreground w-24 text-right text-xs">
                            {hasProducts ? `${bucket.products.length} products` : "—"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
                  <span className="text-muted-foreground">Bars show products becoming stale at each hour</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-3 w-8 rounded bg-linear-to-br from-rose-500 to-teal-500" />
                    <span className="text-muted-foreground">Products → Stale</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staleness Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Staleness Breakdown</CardTitle>
                <CardDescription>How overdue are the stale products? (Active priorities only)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBreakdown ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {staleBreakdown?.buckets.map((bucket, idx) => {
                      const isNeverScraped = bucket.min === null
                      const severity =
                        isNeverScraped || (bucket.min !== null && bucket.min >= 72)
                          ? "high"
                          : bucket.min !== null && bucket.min >= 24
                            ? "medium"
                            : "low"

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-lg border p-4",
                            severity === "high" && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
                            severity === "medium" &&
                              "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
                            severity === "low" &&
                              "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{bucket.label}</span>
                            <span
                              className={cn(
                                "text-xl font-bold",
                                severity === "high" && "text-red-600 dark:text-red-400",
                                severity === "medium" && "text-amber-600 dark:text-amber-400",
                                severity === "low" && "text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {bucket.count.toLocaleString()}
                            </span>
                          </div>
                          {bucket.count > 0 && (
                            <div className="mt-2 flex gap-2 text-xs">
                              {Object.entries(bucket.byPriority)
                                .filter(([, count]) => count > 0)
                                .sort(([a], [b]) => Number(b) - Number(a))
                                .map(([priority, count]) => (
                                  <span key={priority} className="flex items-center gap-1">
                                    <span
                                      className={cn("h-2 w-2 rounded-full", PRIORITY_CONFIG[Number(priority)]?.bgColor)}
                                    />
                                    {count}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  )
}
