"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useActivityLog } from "@/hooks/useActivityLog"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PriorityBubble } from "@/components/PriorityBubble"

import {
  RefreshCwIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ActivityIcon,
  PlayCircleIcon,
} from "lucide-react"

import type { ActivityData } from "../types"
import { PRIORITY_CONFIG } from "../constants"

const ACTIVITY_LOG_LIMIT = 25

export default function ScheduleActivityPage() {
  const [activityLogPage, setActivityLogPage] = useState(1)

  const {
    data: activity,
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["schedule-activity"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=activity")
      return res.data as ActivityData
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })

  const {
    data: activityLog,
    isLoading: isLoadingActivityLog,
    refetch: refetchActivityLog,
  } = useActivityLog({
    page: activityLogPage,
    limit: ACTIVITY_LOG_LIMIT,
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlayCircleIcon className="h-5 w-5 text-emerald-500" />
                  Recent Scraping Activity
                </CardTitle>
                <CardDescription>Live view of products being scraped by the scheduler</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchActivity()}>
                <RefreshCwIcon className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
                <Skeleton className="h-40" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {activity?.windows.map((window, idx) => {
                    const isActive = window.count > 0
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border p-4",
                          isActive
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                            : "bg-muted/30 border-dashed",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{window.label}</span>
                          <span
                            className={cn(
                              "text-xl font-bold",
                              isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                            )}
                          >
                            {window.count.toLocaleString()}
                          </span>
                        </div>
                        {window.count > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                            {Object.entries(window.byPriority)
                              .filter(([, count]) => count > 0)
                              .sort(([a], [b]) => Number(b) - Number(a))
                              .map(([priority, count]) => (
                                <span
                                  key={priority}
                                  className="flex items-center gap-1 rounded bg-white/50 px-1.5 py-0.5 dark:bg-black/20"
                                >
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

                <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Velocity:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {activity?.scrapesPerHour || 0}
                    </span>
                    <span className="text-muted-foreground">scrapes/hour</span>
                  </div>
                  {activity?.scrapesPerHour === 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-500">
                      <AlertTriangleIcon className="mr-1 h-3 w-3" />
                      No recent activity
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClockIcon className="h-5 w-5" />
                  Scrape History
                </CardTitle>
                <CardDescription>
                  {activityLog?.pagination
                    ? `${activityLog.pagination.totalCount.toLocaleString()} products have been scraped`
                    : "Complete log of all scraped products"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchActivityLog()}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingActivityLog ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activityLog?.products && activityLog.products.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-12 p-3 text-left font-medium">#</th>
                        <th className="p-3 text-left font-medium">Product</th>
                        <th className="w-32 p-3 text-left font-medium">Priority</th>
                        <th className="w-40 p-3 text-right font-medium">Last Scraped</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activityLog.products.map((product, idx) => {
                        const rowNumber = (activityLogPage - 1) * ACTIVITY_LOG_LIMIT + idx + 1
                        return (
                          <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                            <td className="text-muted-foreground p-3 font-mono text-xs">{rowNumber}</td>
                            <td className="p-3">
                              <span className="line-clamp-1 font-medium">
                                {product.name || `Product #${product.id}`}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <PriorityBubble priority={product.priority} size="sm" />
                                <span className="text-muted-foreground text-xs">
                                  {PRIORITY_CONFIG[product.priority ?? 0]?.name || "None"}
                                </span>
                              </div>
                            </td>
                            <td className="text-muted-foreground p-3 text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
                                  </TooltipTrigger>
                                  <TooltipContent>{format(new Date(product.updated_at), "PPpp")}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {activityLog.pagination && activityLog.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-muted-foreground text-sm">
                      Showing <span className="font-medium">{(activityLogPage - 1) * ACTIVITY_LOG_LIMIT + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(activityLogPage * ACTIVITY_LOG_LIMIT, activityLog.pagination.totalCount)}
                      </span>{" "}
                      of <span className="font-medium">{activityLog.pagination.totalCount.toLocaleString()}</span>{" "}
                      products
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityLogPage((p) => Math.max(1, p - 1))}
                        disabled={activityLogPage === 1}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, activityLog.pagination.totalPages) }, (_, i) => {
                          const totalPages = activityLog.pagination.totalPages
                          let pageNum: number

                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (activityLogPage <= 3) {
                            pageNum = i + 1
                          } else if (activityLogPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = activityLogPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === activityLogPage ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setActivityLogPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityLogPage((p) => Math.min(activityLog.pagination.totalPages, p + 1))}
                        disabled={!activityLog.pagination.hasMore}
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <AlertTriangleIcon className="mb-2 h-8 w-8 text-amber-500" />
                <h4 className="font-medium">No scraping history yet</h4>
                <p className="text-muted-foreground text-sm">
                  Products will appear here once the scheduler starts scraping.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
