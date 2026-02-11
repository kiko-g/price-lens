"use client"

import { useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { StoreProductCard, ProductCardSkeleton } from "@/components/products/StoreProductCard"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  WrenchIcon,
  Loader2Icon,
  CircleIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanIcon,
  SearchIcon,
  GhostIcon,
  GaugeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PlusIcon,
} from "lucide-react"

import type { CapacityHealthStatus } from "@/app/admin/schedule/types"

import type {
  ScheduleOverview,
  StalenessStatus,
  ProductsByStalenessResponse,
  QStashSchedulesResponse,
} from "@/app/admin/schedule/types"
import { PRIORITY_CONFIG, formatThreshold } from "@/lib/business/priority"

export default function ScheduleDistributionPage() {
  const queryClient = useQueryClient()
  const [fixResult, setFixResult] = useState<{ fixed: number } | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<number | null | undefined>(undefined)
  const [stalenessFilter, setStalenessFilter] = useState<StalenessStatus>("stale-actionable")
  const [viewingPhantomScraped, setViewingPhantomScraped] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 24

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["schedule-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=overview")
      return res.data as ScheduleOverview
    },
    staleTime: 60000,
  })

  const fixPhantomMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=fix-phantom-scraped")
      return res.data as { fixed: number; message: string }
    },
    onSuccess: (data) => {
      setFixResult({ fixed: data.fixed })
      queryClient.invalidateQueries({ queryKey: ["schedule-overview"] })
    },
  })

  // Scrape runs tracking (24h stats)
  const { data: scrapeRunsData } = useQuery({
    queryKey: ["scrape-runs-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=scrape-runs&limit=10")
      return res.data as {
        runs: Array<{
          id: number
          batch_id: string
          started_at: string
          duration_ms: number
          total: number
          success: number
          failed: number
          error: string | null
        }>
        stats24h: {
          totalBatches: number
          totalProducts: number
          totalSuccess: number
          totalFailed: number
          successRate: number
          avgBatchDuration: number
        }
      }
    },
    staleTime: 30000,
  })

  // QStash cron schedule management
  const { data: qstashSchedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["qstash-schedules"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=qstash-schedules")
      return res.data as QStashSchedulesResponse
    },
    staleTime: 30000,
  })

  const createScheduleMutation = useMutation({
    mutationFn: async (cron: string | undefined = undefined) => {
      const res = await axios.post("/api/admin/schedule", {
        action: "create-qstash-cron",
        cron,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qstash-schedules"] })
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await axios.post("/api/admin/schedule", {
        action: "delete-qstash-cron",
        scheduleId,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qstash-schedules"] })
    },
  })

  const pauseScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, isPaused }: { scheduleId: string; isPaused: boolean }) => {
      const res = await axios.post("/api/admin/schedule", {
        action: isPaused ? "resume-qstash-cron" : "pause-qstash-cron",
        scheduleId,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qstash-schedules"] })
    },
  })

  // Fetch products when a priority is selected
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ["products-by-staleness", selectedPriority, stalenessFilter, page],
    queryFn: async () => {
      const priorityParam = selectedPriority === null ? "null" : selectedPriority
      const res = await axios.get(
        `/api/admin/schedule?action=products-by-staleness&priority=${priorityParam}&status=${stalenessFilter}&page=${page}&limit=${limit}`,
      )
      return res.data as ProductsByStalenessResponse
    },
    enabled: selectedPriority !== undefined && !viewingPhantomScraped,
    staleTime: 30000,
  })

  // Fetch phantom scraped products when inspecting
  const {
    data: phantomProductsData,
    isLoading: isLoadingPhantomProducts,
    isFetching: isFetchingPhantomProducts,
  } = useQuery({
    queryKey: ["phantom-scraped-products", page],
    queryFn: async () => {
      const res = await axios.get(
        `/api/admin/schedule?action=products-by-staleness&priority=5&status=phantom-scraped&page=${page}&limit=${limit}`,
      )
      return res.data as ProductsByStalenessResponse
    },
    enabled: viewingPhantomScraped,
    staleTime: 30000,
  })

  const handlePriorityClick = (priority: number | null) => {
    setViewingPhantomScraped(false)
    if (selectedPriority === priority) {
      setSelectedPriority(undefined)
    } else {
      setSelectedPriority(priority)
      setPage(1)
    }
  }

  const handleFilterChange = (filter: StalenessStatus) => {
    setStalenessFilter(filter)
    setPage(1)
  }

  const selectedStat = overview?.priorityStats.find((s) => s.priority === selectedPriority)
  const priorityConfig = selectedPriority !== null ? PRIORITY_CONFIG[selectedPriority ?? 0] : null

  const getStatusConfig = (status: CapacityHealthStatus) => {
    switch (status) {
      case "healthy":
        return {
          label: "Healthy",
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
          borderColor: "border-emerald-500",
          icon: CheckCircle2Icon,
        }
      case "degraded":
        return {
          label: "Degraded",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/20",
          borderColor: "border-amber-500",
          icon: AlertTriangleIcon,
        }
      case "critical":
        return {
          label: "Critical",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-500",
          icon: AlertTriangleIcon,
        }
    }
  }

  if (isLoadingOverview) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="col-span-1 h-45 w-full lg:col-span-2" />
            <Skeleton className="col-span-1 h-45 w-full lg:col-span-1" />

            <Skeleton className="col-span-1 h-40 w-full lg:col-span-3" />

            <Skeleton className="col-span-1 h-50 w-full lg:col-span-3" />

            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="col-span-1 h-48 w-full lg:col-span-1" />
            ))}
            <Skeleton className="col-span-1 h-12 w-full lg:col-span-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Capacity Health Indicator */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {overview?.capacity && (
            <Card
              className={cn(
                "col-span-1 lg:col-span-2",
                getStatusConfig(overview.capacity.status).borderColor,
                getStatusConfig(overview.capacity.status).bgColor,
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className={cn("flex items-center gap-2 text-lg", getStatusConfig(overview.capacity.status).color)}
                  >
                    <GaugeIcon className="h-5 w-5" />
                    Scheduler Capacity: {getStatusConfig(overview.capacity.status).label}
                  </CardTitle>
                  <Badge
                    variant={
                      overview.capacity.status === "healthy"
                        ? "success"
                        : overview.capacity.status === "degraded"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {overview.capacity.utilizationPercent}% utilization
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <TrendingUpIcon className="h-3.5 w-3.5" />
                      Required Daily
                    </div>
                    <p className="mt-1 text-xl font-bold">{overview.capacity.requiredDailyScrapes.toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">scrapes/day</p>
                  </div>
                  <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <GaugeIcon className="h-3.5 w-3.5" />
                      Available Capacity
                    </div>
                    <p className="mt-1 text-xl font-bold">
                      {overview.capacity.availableDailyCapacity.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">scrapes/day</p>
                  </div>
                  {overview.capacity.deficit > 0 ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                      <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <TrendingDownIcon className="h-3.5 w-3.5" />
                        Daily Deficit
                      </div>
                      <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                        -{overview.capacity.deficit.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80">scrapes short</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                        Surplus
                      </div>
                      <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        +{overview.capacity.surplusPercent.toFixed(0)}%
                      </p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">extra capacity</p>
                    </div>
                  )}
                  <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <CircleIcon className="h-3.5 w-3.5" />
                      Config
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {overview.capacity.config.batchSize} × {overview.capacity.config.maxBatches}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      every {overview.capacity.config.cronFrequencyMinutes}m ({overview.capacity.config.runsPerDay}{" "}
                      runs/day)
                    </p>
                  </div>
                </div>

                {overview.capacity.status === "critical" && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-100 p-3 dark:border-red-900 dark:bg-red-950/50">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      System cannot keep up with scraping demands. Products will accumulate staleness over time.
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Consider: increasing batch size, running cron more frequently, or reducing product priorities.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phantom Scraped Warning */}
          {overview && overview.totalPhantomScraped > 0 && (
            <Card className="col-span-1 border-amber-500 bg-amber-50 sm:col-span-1 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                  <AlertTriangleIcon className="h-5 w-5" />
                  Data Integrity Issue Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3 text-sm">
                  Found <strong className="text-foreground">{overview.totalPhantomScraped.toLocaleString()}</strong>{" "}
                  products that appear scraped (have{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">updated_at</code> set) but have{" "}
                  <strong>no price records</strong>. These products won&apos;t be picked up by the scheduler.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingPhantomScraped(true)
                      setSelectedPriority(undefined)
                      setPage(1)
                    }}
                    className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                  >
                    <SearchIcon className="h-4 w-4" />
                    Inspect Products
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fixPhantomMutation.mutate()}
                    disabled={fixPhantomMutation.isPending}
                    className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                  >
                    {fixPhantomMutation.isPending ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <WrenchIcon className="h-4 w-4" />
                        Fix {overview.totalPhantomScraped.toLocaleString()} products
                      </>
                    )}
                  </Button>
                  {fixResult && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                      ✓ Fixed {fixResult.fixed} products - they will be scraped on the next run
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QStash Cron Schedule Management */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClockIcon className="h-5 w-5" />
                QStash Cron Schedule
              </CardTitle>
              {isLoadingSchedules ? (
                <Skeleton className="h-6 w-20" />
              ) : qstashSchedules && qstashSchedules.total > 0 ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="destructive">Not configured</Badge>
              )}
            </div>
            <CardDescription>
              External cron via QStash - bypasses Vercel plan limitations on cron frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSchedules ? (
              <Skeleton className="h-16 w-full" />
            ) : qstashSchedules && qstashSchedules.total > 0 ? (
              <div className="space-y-3">
                {qstashSchedules.schedules.map((schedule) => (
                  <div
                    key={schedule.scheduleId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
                          {schedule.cron}
                        </code>
                        {schedule.isPaused ? (
                          <Badge variant="warning" size="xs">
                            Paused
                          </Badge>
                        ) : (
                          <Badge variant="success" size="xs">
                            Running
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        ID: {schedule.scheduleId.slice(0, 12)}... &middot; Created{" "}
                        {new Date(schedule.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          pauseScheduleMutation.mutate({
                            scheduleId: schedule.scheduleId,
                            isPaused: schedule.isPaused,
                          })
                        }
                        disabled={pauseScheduleMutation.isPending}
                        aria-label={schedule.isPaused ? "Resume schedule" : "Pause schedule"}
                      >
                        {schedule.isPaused ? (
                          <PlayIcon className="h-3.5 w-3.5" />
                        ) : (
                          <PauseIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => deleteScheduleMutation.mutate(schedule.scheduleId)}
                        disabled={deleteScheduleMutation.isPending}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        aria-label="Delete schedule"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start justify-start gap-2 text-center">
                <p className="text-muted-foreground text-sm">
                  No QStash cron schedule configured. Vercel&apos;s built-in cron may be limited to once per day on
                  non-Pro plans.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => createScheduleMutation.mutate(undefined)}
                  disabled={createScheduleMutation.isPending}
                >
                  {createScheduleMutation.isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      Create QStash Cron (every {overview?.capacity?.config.cronFrequencyMinutes ?? 15}m)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scrape Runs - 24h Stats */}
        {scrapeRunsData?.stats24h && scrapeRunsData.stats24h.totalBatches > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUpIcon className="h-5 w-5" />
                Actual Throughput (Last 24h)
              </CardTitle>
              <CardDescription>Persistent tracking of batch-worker executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Batches Run</div>
                  <p className="mt-1 text-xl font-bold">{scrapeRunsData.stats24h.totalBatches}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Products Scraped</div>
                  <p className="mt-1 text-xl font-bold">{scrapeRunsData.stats24h.totalProducts.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">
                    {scrapeRunsData.stats24h.totalSuccess.toLocaleString()} success /{" "}
                    {scrapeRunsData.stats24h.totalFailed.toLocaleString()} failed
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Success Rate</div>
                  <p
                    className={cn(
                      "mt-1 text-xl font-bold",
                      scrapeRunsData.stats24h.successRate >= 90
                        ? "text-emerald-600"
                        : scrapeRunsData.stats24h.successRate >= 70
                          ? "text-amber-600"
                          : "text-red-600",
                    )}
                  >
                    {scrapeRunsData.stats24h.successRate}%
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Avg Batch Duration</div>
                  <p className="mt-1 text-xl font-bold">
                    {(scrapeRunsData.stats24h.avgBatchDuration / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overview?.priorityStats
            .filter((s) => s.priority !== null)
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            .map((stat) => {
              const config = PRIORITY_CONFIG[stat.priority ?? 0]
              const isActive = overview.activePriorities.includes(stat.priority ?? 0)
              const isSelected = selectedPriority === stat.priority

              // Calculate percentages for the 3-segment bar (Fresh | Stale Actionable | Unavailable)
              const freshPercent = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0
              const staleActionablePercent = stat.total > 0 ? Math.round((stat.staleActionable / stat.total) * 100) : 0
              const unavailablePercent = stat.total > 0 ? Math.round((stat.unavailable / stat.total) * 100) : 0

              return (
                <div
                  key={stat.priority}
                  onClick={() => handlePriorityClick(stat.priority)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 transition-all",
                    !isActive && "bg-accent border-dashed opacity-80",
                    isSelected && "ring-primary ring-2 ring-offset-2",
                    !isSelected && "hover:border-primary/50 hover:shadow-sm",
                  )}
                >
                  <div className="mb-2 flex flex-col flex-wrap gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PriorityBubble priority={stat.priority} size="sm" />
                        <span className="font-medium">{config?.description}</span>
                      </div>
                      {!isActive && (
                        <Badge variant="default" className="text-xs" size="xs">
                          Not scheduled
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-sm font-medium">{stat.total.toLocaleString()} products</span>
                      <span className="text-muted-foreground">
                        Refresh: {formatThreshold(stat.stalenessThresholdHours)}
                      </span>
                    </div>
                  </div>

                  {/* 3-segment progress bar: Fresh (green) | Stale Actionable (orange) | Unavailable (gray) */}
                  <div className="flex h-6 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                    {stat.fresh > 0 && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                              style={{ width: `${freshPercent}%` }}
                            >
                              {freshPercent > 10 && stat.fresh.toLocaleString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {stat.staleActionable > 0 && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center justify-center bg-orange-500 text-xs font-medium text-white transition-all"
                              style={{ width: `${staleActionablePercent}%` }}
                            >
                              {staleActionablePercent > 10 && stat.staleActionable.toLocaleString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stat.staleActionable.toLocaleString()} stale actionable ({staleActionablePercent}%)
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {stat.unavailable > 0 && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center justify-center bg-gray-400 text-xs font-medium text-white transition-all dark:bg-gray-600"
                              style={{ width: `${unavailablePercent}%` }}
                            >
                              {unavailablePercent > 10 && stat.unavailable.toLocaleString()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stat.unavailable.toLocaleString()} unavailable ({unavailablePercent}%)
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* Stats breakdown */}
                  <div className="mt-3 flex flex-col gap-1 text-xs font-medium">
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle2Icon className="h-4 w-4" />
                      {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                    </span>
                    {stat.staleActionable > 0 && (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <AlertTriangleIcon className="h-4 w-4" />
                        {stat.staleActionable.toLocaleString()} stale actionable ({staleActionablePercent}%)
                      </span>
                    )}
                    {stat.unavailable > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <BanIcon className="h-4 w-4" />
                        {stat.unavailable.toLocaleString()} unavailable ({unavailablePercent}%)
                      </span>
                    )}
                    {stat.neverScraped > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px] opacity-70">
                        <CircleIcon className="h-3 w-3" />
                        {stat.neverScraped.toLocaleString()} never scraped
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          {overview?.priorityStats.find((s) => s.priority === null) && (
            <div
              onClick={() => handlePriorityClick(null)}
              className={cn(
                "bg-accent col-span-1 flex cursor-pointer justify-between gap-2 rounded-lg border border-dashed p-4 opacity-80 transition-all sm:col-span-2 lg:col-span-3",
                selectedPriority === null && "ring-primary ring-2 ring-offset-2",
                selectedPriority !== null && "hover:border-primary/50 hover:shadow-sm",
              )}
            >
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
        </section>

        {/* Phantom Scraped Products Section */}
        {viewingPhantomScraped && (
          <Card className="border-amber-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <GhostIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-amber-700 dark:text-amber-400">
                      Phantom Scraped Products
                    </CardTitle>
                    <CardDescription>
                      {phantomProductsData?.pagination.totalCount.toLocaleString() ?? "..."} products with{" "}
                      <code className="rounded bg-amber-100 px-1 text-xs dark:bg-amber-900">updated_at</code> set but no
                      price records
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setViewingPhantomScraped(false)
                    setPage(1)
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPhantomProducts ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: limit }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : phantomProductsData?.data && phantomProductsData.data.length > 0 ? (
                <>
                  <div
                    className={cn(
                      "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
                      isFetchingPhantomProducts && "opacity-50",
                    )}
                  >
                    {phantomProductsData.data.map((product) => (
                      <StoreProductCard key={product.id} sp={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {phantomProductsData.pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Page {phantomProductsData.pagination.page} of {phantomProductsData.pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={!phantomProductsData.pagination.hasPreviousPage || isFetchingPhantomProducts}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!phantomProductsData.pagination.hasNextPage || isFetchingPhantomProducts}
                        >
                          Next
                          <ChevronRightIcon className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <GhostIcon className="mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No phantom scraped products found</p>
                  <p className="text-sm">All products with price data are properly tracked.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Detail Section */}
        {selectedPriority !== undefined && !viewingPhantomScraped && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PriorityBubble priority={selectedPriority} size="md" />
                  <div>
                    <CardTitle className="text-lg">
                      {selectedPriority === null ? "Unclassified" : priorityConfig?.description} Products
                    </CardTitle>
                    <CardDescription>
                      {productsData?.pagination.totalCount.toLocaleString() ?? "..."} products matching filter
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedPriority(undefined)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <Tabs
                value={stalenessFilter}
                onValueChange={(v) => handleFilterChange(v as StalenessStatus)}
                className="mb-6"
              >
                <TabsList className="flex-wrap">
                  <TabsTrigger value="stale-actionable" className="gap-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    Stale Actionable
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.staleActionable.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="fresh" className="gap-2">
                    <CheckCircle2Icon className="h-4 w-4" />
                    Fresh
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.fresh.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="unavailable" className="gap-2">
                    <BanIcon className="h-4 w-4" />
                    Unavailable
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.unavailable.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="never-scraped" className="gap-2">
                    <CircleIcon className="h-4 w-4" />
                    Never Scraped
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.neverScraped.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Products Grid */}
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: limit }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : productsData?.data && productsData.data.length > 0 ? (
                <>
                  <div
                    className={cn(
                      "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
                      isFetchingProducts && "opacity-50",
                    )}
                  >
                    {productsData.data.map((product) => (
                      <StoreProductCard key={product.id} sp={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {productsData.pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Page {productsData.pagination.page} of {productsData.pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={!productsData.pagination.hasPreviousPage || isFetchingProducts}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!productsData.pagination.hasNextPage || isFetchingProducts}
                        >
                          Next
                          <ChevronRightIcon className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <CircleIcon className="mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm">
                    There are no{" "}
                    {stalenessFilter === "stale-actionable"
                      ? "stale actionable"
                      : stalenessFilter === "never-scraped"
                        ? "never scraped"
                        : stalenessFilter}{" "}
                    products for this priority level.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
