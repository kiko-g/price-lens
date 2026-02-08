"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  CalendarIcon,
  ClockIcon,
  RefreshCwIcon,
  ZapIcon,
  TrendingUpIcon,
  TimerIcon,
  InfoIcon,
  DollarSignIcon,
  ActivityIcon,
} from "lucide-react"

import type { ScheduleOverview } from "@/app/admin/schedule/types"
import { PriorityBubble } from "@/components/products/PriorityBubble"

export default function ScheduleOverviewPage() {
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
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="text-primary size-5" />
                Scrape Schedule
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchOverview()}>
                <RefreshCwIcon className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="space-y-1">
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

              {/* Active Priorities */}
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-medium uppercase">Active Priorities</div>
                {isLoadingOverview ? (
                  <Skeleton className="h-6 w-full" />
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {overview?.activePriorities.map((p) => (
                        <PriorityBubble key={p} priority={p} size="xs" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Priority 0-1 not scheduled
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="ml-1 inline h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Most products are at priority 1 as a safety measure. Enable them gradually as you tune
                            priorities.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </p>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-start gap-2 text-xs">
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                  <div className="space-y-1">
                    <p>
                      <strong>Cron:</strong> Runs every 30 min via Vercel.
                    </p>
                    <p>
                      <strong>Thresholds:</strong> P5: 24h, P4: 48h, P3: 72h, P2: 168h.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 md:grid-cols-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
