"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PriorityBubble } from "@/components/PriorityBubble"

import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"

import type { ScheduleOverview } from "../types"
import { PRIORITY_CONFIG, formatThreshold } from "../constants"

export default function ScheduleDistributionPage() {
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["schedule-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=overview")
      return res.data as ScheduleOverview
    },
    staleTime: 60000,
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
            <CardDescription>Product count and staleness by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overview?.priorityStats
                  .filter((s) => s.priority !== null)
                  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                  .map((stat) => {
                    const config = PRIORITY_CONFIG[stat.priority ?? 0]
                    const isActive = overview.activePriorities.includes(stat.priority ?? 0)
                    const stalePercent = stat.total > 0 ? Math.round((stat.stale / stat.total) * 100) : 0
                    const freshPercent = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0

                    return (
                      <div
                        key={stat.priority}
                        className={cn(
                          "rounded-lg border p-4",
                          !isActive && "bg-accent cursor-not-allowed border border-dashed opacity-80",
                        )}
                      >
                        <div className="mb-2 flex flex-col flex-wrap gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <PriorityBubble priority={stat.priority} size="sm" />
                              <span className="font-medium">{config?.name}</span>
                            </div>
                            {!isActive && (
                              <Badge variant="default" className="text-xs" size="xs">
                                Not scheduled
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stat.total.toLocaleString()} products</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Refresh: {formatThreshold(stat.stalenessThresholdHours)}
                            </span>
                          </div>
                        </div>

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

                        <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium">
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangleIcon className="h-3 w-3" />
                            {stat.stale.toLocaleString()} stale ({stalePercent}%)
                          </span>
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle2Icon className="h-3 w-3" />
                            {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
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

                {overview?.priorityStats.find((s) => s.priority === null) && (
                  <div className="bg-accent col-span-1 flex justify-between gap-2 rounded-lg border border-dashed p-4 opacity-80 sm:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-2">
                      <PriorityBubble priority={null} size="sm" />
                      <span className="font-medium">Unclassified</span>
                      <span className="text-muted-foreground text-sm">
                        ({overview.priorityStats.find((s) => s.priority === null)?.total.toLocaleString()} products)
                      </span>
                    </div>

                    <div>
                      <Badge variant="default" className="text-xs" size="xs">
                        Not scheduled
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
