"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { cn } from "@/lib/utils"
import { useAdminStoreProductFilters } from "@/hooks/useAdminStoreProductFilters"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PriorityBubble } from "@/components/PriorityBubble"

import {
  PlayIcon,
  SquareIcon,
  RefreshCwIcon,
  BarcodeIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  ZapIcon,
  PackageIcon,
  Loader2Icon,
  AlertTriangleIcon,
  ServerIcon,
  MonitorIcon,
  CircleIcon,
  CircleCheckIcon,
  CircleXIcon,
} from "lucide-react"

interface BulkScrapeJob {
  id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  filters: {
    origins: number[]
    priorities: number[]
    missingBarcode: boolean
    category?: string
  }
  total: number
  processed: number
  failed: number
  barcodesFound: number
  startedAt: string
  updatedAt: string
  completedAt?: string
  stats?: {
    progress: number
    rate: string
    elapsedSeconds: number
    etaSeconds: number | null
    remaining: number
  }
}

export default function BulkScrapePage() {
  const queryClient = useQueryClient()

  // Use shared admin filters hook
  const {
    origins,
    priorities,
    missingBarcode,
    available,
    setMissingBarcode,
    setAvailable,
    toggleOrigin,
    togglePriority,
    filters,
    count,
    isLoadingCount,
    refetchCount,
    invalidateCount,
    originOptions,
    priorityLevels,
  } = useAdminStoreProductFilters({
    initialFilters: { origins: [2] },
    queryKeyPrefix: "bulk-scrape",
  })

  // Mode: "qstash" for production, "direct" for local development
  const [useDirectMode, setUseDirectMode] = useState(true) // Default to direct for local dev
  const [isDirectProcessing, setIsDirectProcessing] = useState(false)

  // Active job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Ref to track cancellation request (avoids stale closure in while loop)
  const cancelRequestedRef = useRef(false)

  // Fetch active jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["bulk-scrape-jobs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/bulk-scrape?action=jobs")
      return res.data as { jobs: BulkScrapeJob[] }
    },
    staleTime: 60000, // Consider fresh for 60 seconds
    // No polling - we manually refetch when starting/stopping jobs
  })

  // Fetch active job progress
  const { data: jobProgress } = useQuery({
    queryKey: ["bulk-scrape-progress", activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null
      const res = await axios.get(`/api/admin/bulk-scrape/${activeJobId}`)
      return res.data as BulkScrapeJob
    },
    enabled: !!activeJobId,
    refetchInterval: activeJobId ? 2000 : false,
  })

  // Auto-select most recent running job
  useEffect(() => {
    if (jobsData?.jobs) {
      const runningJob = jobsData.jobs.find((j) => j.status === "running")
      if (runningJob && !activeJobId) {
        setActiveJobId(runningJob.id)
      }
    }
  }, [jobsData, activeJobId])

  // Clear active job when completed
  useEffect(() => {
    if (jobProgress?.status === "completed" || jobProgress?.status === "cancelled") {
      // Keep showing for a bit then clear
      const timer = setTimeout(() => {
        refetchJobs()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [jobProgress?.status, refetchJobs])

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/admin/bulk-scrape", {
        origins: filters.origins,
        priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
        missingBarcode: filters.missingBarcode,
        available: filters.available,
      })
      return res.data as { jobId: string; total: number }
    },
    onSuccess: (data) => {
      setActiveJobId(data.jobId)
      refetchJobs()
      invalidateCount()
    },
  })

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      // Set ref immediately so the while loop can check it
      cancelRequestedRef.current = true
      await axios.delete(`/api/admin/bulk-scrape/${jobId}`)
    },
    onSuccess: () => {
      setIsDirectProcessing(false)
      refetchJobs()
    },
  })

  // Direct mode: process batches continuously
  const processDirectBatch = useCallback(
    async (jobId: string | null) => {
      try {
        const payload = jobId
          ? { jobId, batchSize: 5 }
          : {
              origins: filters.origins,
              priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
              missingBarcode: filters.missingBarcode,
              available: filters.available,
              batchSize: 5,
            }

        const res = await axios.patch("/api/admin/bulk-scrape", payload)
        return res.data
      } catch (error) {
        console.error("Direct batch error:", error)
        throw error
      }
    },
    [filters],
  )

  // Direct mode continuous processing
  const startDirectMode = useCallback(async () => {
    setIsDirectProcessing(true)
    cancelRequestedRef.current = false // Reset cancel flag
    let currentJobId: string | null = null

    try {
      // First call creates the job
      const firstResult = await processDirectBatch(null)
      currentJobId = firstResult.jobId
      setActiveJobId(currentJobId)

      // Keep processing until complete
      while (true) {
        // Check local cancel flag first (immediate response)
        if (cancelRequestedRef.current) {
          console.info("[Direct Mode] Cancel requested, stopping...")
          break
        }

        // Check if job was cancelled/completed on server
        const job = await axios.get(`/api/admin/bulk-scrape/${currentJobId}`)
        if (job.data.status === "cancelled" || job.data.status === "completed") {
          break
        }

        const result = await processDirectBatch(currentJobId)

        if (result.status === "completed") {
          break
        }

        // Small delay between batches to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error("Direct mode error:", error)
    } finally {
      setIsDirectProcessing(false)
      cancelRequestedRef.current = false
      refetchJobs()
      queryClient.invalidateQueries({ queryKey: ["bulk-scrape-progress", currentJobId] })
    }
  }, [processDirectBatch, refetchJobs, queryClient])

  // Handle start button click
  const handleStart = useCallback(() => {
    if (useDirectMode) {
      startDirectMode()
    } else {
      startJobMutation.mutate()
    }
  }, [useDirectMode, startDirectMode, startJobMutation])

  const isJobRunning = jobProgress?.status === "running" || isDirectProcessing

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Sidebar - Filters */}
      <aside className="flex h-auto min-h-0 flex-col border-b lg:w-80 lg:min-w-80 lg:shrink-0 lg:border-r lg:border-b-0">
        {/* Scrollable filters section */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCwIcon className="text-primary size-5" />
            <h2 className="text-lg font-bold">Bulk Re-Scrape</h2>
          </div>

          {/* Store Origin Filter */}
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Store Origin</Label>
            <div className="flex flex-col gap-2">
              {originOptions.map((origin) => (
                <label
                  key={origin.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                    origins.includes(origin.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <Checkbox checked={origins.includes(origin.id)} onCheckedChange={() => toggleOrigin(origin.id)} />
                  <span className="text-sm font-medium">{origin.name}</span>
                  {!origin.hasBarcode && (
                    <Badge variant="destructive" className="ml-auto text-xs" size="2xs">
                      No EAN
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Missing Data Filter */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Missing Data</Label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox checked={missingBarcode} onCheckedChange={() => setMissingBarcode(!missingBarcode)} />
              <BarcodeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Only products missing barcode</span>
            </label>
          </div>

          {/* Availability Filter */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Availability</Label>
            <div className="flex flex-wrap gap-2">
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
                  available === null ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
                onClick={() => setAvailable(null)}
              >
                <CircleIcon className="h-3.5 w-3.5" />
                <span className="text-sm">All</span>
              </div>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
                  available === true ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
                onClick={() => setAvailable(true)}
              >
                <CircleCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm">Available</span>
              </div>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
                  available === false ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
                onClick={() => setAvailable(false)}
              >
                <CircleXIcon className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm">Unavailable</span>
              </div>
            </div>
          </div>

          {/* Priority Filter */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Priority Level (optional)</Label>
            <div className="flex flex-col gap-2">
              {priorityLevels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${level}`}
                    checked={priorities.includes(level)}
                    onCheckedChange={() => togglePriority(level)}
                  />
                  <Label
                    htmlFor={`priority-${level}`}
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <PriorityBubble priority={level} size="sm" useDescription />
                  </Label>
                </div>
              ))}
            </div>
            {priorities.length === 0 && (
              <p className="text-muted-foreground text-xs">All priorities will be included</p>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="mt-4 space-y-3 border-t pt-4">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Processing Mode</Label>
            <div className="flex flex-col gap-2">
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                  useDirectMode ? "border-primary bg-primary/10" : "border-border",
                )}
                onClick={() => setUseDirectMode(true)}
              >
                <MonitorIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Direct Mode</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Local Dev
                </Badge>
              </div>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                  !useDirectMode ? "border-primary bg-primary/10" : "border-border",
                )}
                onClick={() => setUseDirectMode(false)}
              >
                <ServerIcon className="h-4 w-4" />
                <span className="text-sm font-medium">QStash Mode</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Production
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              {useDirectMode
                ? "Direct mode processes products in the browser. Best for local development."
                : "QStash mode queues products for async processing. Requires public URL (production)."}
            </p>
          </div>
        </div>

        {/* Fixed Count & Start Button */}
        <div className="bg-background shrink-0 border-t p-4">
          <div className="flex items-center gap-2">
            <PackageIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">Matching:</span>
            {isLoadingCount ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="text-lg font-bold">{count.toLocaleString()}</span>
            )}
          </div>
          <Button
            onClick={handleStart}
            disabled={count === 0 || startJobMutation.isPending || isJobRunning}
            className="mt-3 w-full"
          >
            {startJobMutation.isPending || isDirectProcessing ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {isDirectProcessing ? "Processing..." : "Starting..."}
              </>
            ) : isJobRunning ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Job Running...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Start Re-Scrape
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Jobs & Progress</h1>
            <Button variant="outline" size="sm" onClick={() => refetchCount()}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Live Progress */}
          {jobProgress && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {jobProgress.status === "running" && <Loader2Icon className="h-5 w-5 animate-spin text-blue-500" />}
                    {jobProgress.status === "completed" && <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />}
                    {jobProgress.status === "cancelled" && <XCircleIcon className="h-5 w-5 text-amber-500" />}
                    {jobProgress.status === "failed" && <AlertTriangleIcon className="h-5 w-5 text-red-500" />}
                    Job {jobProgress.id}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        jobProgress.status === "running"
                          ? "default"
                          : jobProgress.status === "completed"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {jobProgress.status}
                    </Badge>
                    {jobProgress.status === "running" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelJobMutation.mutate(jobProgress.id)}
                        disabled={cancelJobMutation.isPending}
                      >
                        <SquareIcon className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {jobProgress.processed.toLocaleString()} / {jobProgress.total.toLocaleString()}
                      <span className="text-muted-foreground ml-1">({jobProgress.stats?.progress ?? 0}%)</span>
                    </span>
                  </div>
                  <Progress value={jobProgress.stats?.progress ?? 0} className="h-3" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard
                    icon={<PackageIcon className="h-4 w-4" />}
                    label="Processed"
                    value={jobProgress.processed.toLocaleString()}
                    color="text-blue-500"
                  />
                  <StatCard
                    icon={<XCircleIcon className="h-4 w-4" />}
                    label="Failed"
                    value={jobProgress.failed.toLocaleString()}
                    color="text-red-500"
                  />
                  <StatCard
                    icon={<BarcodeIcon className="h-4 w-4" />}
                    label="Barcodes Found"
                    value={jobProgress.barcodesFound.toLocaleString()}
                    color="text-emerald-500"
                  />
                  <StatCard
                    icon={<ZapIcon className="h-4 w-4" />}
                    label="Rate"
                    value={jobProgress.stats?.rate ?? "—"}
                    color="text-amber-500"
                  />
                </div>

                {/* Time Info */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Started: {new Date(jobProgress.startedAt).toLocaleTimeString()}
                  </span>
                  {jobProgress.stats?.etaSeconds && jobProgress.status === "running" && (
                    <span>ETA: ~{formatDuration(jobProgress.stats.etaSeconds)}</span>
                  )}
                  {jobProgress.completedAt && (
                    <span>Completed: {new Date(jobProgress.completedAt).toLocaleTimeString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state when no job is running */}
          {!jobProgress && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <PackageIcon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-medium">No Active Job</h3>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                  Configure your filters in the sidebar and click &quot;Start Re-Scrape&quot; to begin processing
                  products.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Jobs */}
          {jobsData?.jobs && jobsData.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobsData.jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between",
                        activeJobId === job.id && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            job.status === "running"
                              ? "default"
                              : job.status === "completed"
                                ? "secondary"
                                : "destructive"
                          }
                          className="w-20 justify-center"
                        >
                          {job.status}
                        </Badge>
                        <span className="font-mono text-sm">{job.id}</span>
                        <span className="text-muted-foreground text-sm">
                          {job.processed.toLocaleString()} / {job.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                          {new Date(job.startedAt).toLocaleString()}
                        </span>
                        {job.status === "running" && activeJobId !== job.id && (
                          <Button variant="ghost" size="sm" onClick={() => setActiveJobId(job.id)}>
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-muted/50 rounded-md p-3">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}
