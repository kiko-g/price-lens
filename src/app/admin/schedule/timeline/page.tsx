"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { TimelineData, StaleBreakdown } from "@/app/admin/schedule/types"
import { PRIORITY_CONFIG } from "@/app/admin/schedule/constants"

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEE, MMM d")
}

export default function ScheduleTimelinePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["schedule-timeline", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/schedule?action=timeline&date=${format(selectedDate, "yyyy-MM-dd")}`)
      return res.data as TimelineData
    },
    staleTime: 60000,
  })

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

  const maxProductsInHour = useMemo(() => {
    if (!timeline) return 0
    return Math.max(...timeline.hourlyBuckets.map((b) => b.products.length), 1)
  }, [timeline])

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Timeline */}
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
                  <CalendarIcon className="h-4 w-4" />
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
                {Array.from({ length: 12 }).map((_, i: number) => (
                  <Skeleton className="h-8 w-full" key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {timeline?.hourlyBuckets.map((bucket) => {
                  const barWidth = maxProductsInHour > 0 ? (bucket.products.length / maxProductsInHour) * 100 : 0
                  const hasProducts = bucket.products.length > 0

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
    </div>
  )
}
