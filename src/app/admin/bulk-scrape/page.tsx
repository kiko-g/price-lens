"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
} from "lucide-react"
import { cn } from "@/lib/utils"

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

const ORIGIN_OPTIONS = [
  { id: 1, name: "Continente", hasBarcode: true },
  { id: 2, name: "Auchan", hasBarcode: true },
  { id: 3, name: "Pingo Doce", hasBarcode: false },
]

const PRIORITY_OPTIONS = [
  { id: 5, name: "Premium", color: "bg-purple-500" },
  { id: 4, name: "High", color: "bg-blue-500" },
  { id: 3, name: "Medium", color: "bg-emerald-500" },
  { id: 2, name: "Low", color: "bg-yellow-500" },
  { id: 1, name: "Minimal", color: "bg-orange-500" },
  { id: 0, name: "None", color: "bg-gray-500" },
]

export default function BulkScrapePage() {
  const queryClient = useQueryClient()

  // Filters state
  const [selectedOrigins, setSelectedOrigins] = useState<number[]>([1, 2])
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([])
  const [missingBarcode, setMissingBarcode] = useState(true)

  // Mode: "qstash" for production, "direct" for local development
  const [useDirectMode, setUseDirectMode] = useState(true) // Default to direct for local dev
  const [isDirectProcessing, setIsDirectProcessing] = useState(false)

  // Active job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Build filter params
  const filterParams = new URLSearchParams()
  if (selectedOrigins.length > 0) filterParams.set("origins", selectedOrigins.join(","))
  if (selectedPriorities.length > 0) filterParams.set("priorities", selectedPriorities.join(","))
  filterParams.set("missingBarcode", String(missingBarcode))

  // Fetch matching count
  const {
    data: countData,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["bulk-scrape-count", filterParams.toString()],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/bulk-scrape?${filterParams}`)
      return res.data as { count: number }
    },
    staleTime: 30000,
  })

  // Fetch active jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["bulk-scrape-jobs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/bulk-scrape?action=jobs")
      return res.data as { jobs: BulkScrapeJob[] }
    },
    refetchInterval: 5000,
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
        origins: selectedOrigins,
        priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        missingBarcode,
      })
      return res.data as { jobId: string; total: number }
    },
    onSuccess: (data) => {
      setActiveJobId(data.jobId)
      refetchJobs()
      queryClient.invalidateQueries({ queryKey: ["bulk-scrape-count"] })
    },
  })

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
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
              origins: selectedOrigins,
              priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
              missingBarcode,
              batchSize: 5,
            }

        const res = await axios.patch("/api/admin/bulk-scrape", payload)
        return res.data
      } catch (error) {
        console.error("Direct batch error:", error)
        throw error
      }
    },
    [selectedOrigins, selectedPriorities, missingBarcode],
  )

  // Direct mode continuous processing
  const startDirectMode = useCallback(async () => {
    setIsDirectProcessing(true)
    let currentJobId: string | null = null

    try {
      // First call creates the job
      const firstResult = await processDirectBatch(null)
      currentJobId = firstResult.jobId
      setActiveJobId(currentJobId)

      // Keep processing until complete
      while (true) {
        // Check if we should stop
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

  const toggleOrigin = useCallback((originId: number) => {
    setSelectedOrigins((prev) => (prev.includes(originId) ? prev.filter((id) => id !== originId) : [...prev, originId]))
  }, [])

  const togglePriority = useCallback((priorityId: number) => {
    setSelectedPriorities((prev) =>
      prev.includes(priorityId) ? prev.filter((id) => id !== priorityId) : [...prev, priorityId],
    )
  }, [])

  const matchingCount = countData?.count ?? 0
  const isJobRunning = jobProgress?.status === "running" || isDirectProcessing

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bulk Re-Scrape</h1>
            <p className="text-muted-foreground mt-1">Re-scrape products to update data and discover barcodes</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCount()}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Select which products to re-scrape</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Origin Filter */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-medium uppercase">Store Origin</Label>
              <div className="flex flex-wrap gap-3">
                {ORIGIN_OPTIONS.map((origin) => (
                  <label
                    key={origin.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                      selectedOrigins.includes(origin.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Checkbox
                      checked={selectedOrigins.includes(origin.id)}
                      onCheckedChange={() => toggleOrigin(origin.id)}
                    />
                    <span className="text-sm font-medium">{origin.name}</span>
                    {!origin.hasBarcode && (
                      <Badge variant="destructive" className="ml-1 text-xs" size="2xs">
                        No EAN
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-medium uppercase">Priority Level (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((priority) => (
                  <label
                    key={priority.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                      selectedPriorities.includes(priority.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedPriorities.includes(priority.id)}
                      onCheckedChange={() => togglePriority(priority.id)}
                    />
                    <span className={`h-2 w-2 rounded-full ${priority.color}`} />
                    <span className="text-sm">{priority.name}</span>
                  </label>
                ))}
              </div>
              {selectedPriorities.length === 0 && (
                <p className="text-muted-foreground text-xs">All priorities will be included</p>
              )}
            </div>

            {/* Missing Data Filter */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-medium uppercase">Missing Data</Label>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox checked={missingBarcode} onCheckedChange={() => setMissingBarcode(!missingBarcode)} />
                <BarcodeIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Only products missing barcode</span>
              </label>
            </div>

            {/* Mode Toggle */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-medium uppercase">Processing Mode</Label>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                    useDirectMode ? "border-primary bg-primary/10" : "border-border",
                  )}
                  onClick={() => setUseDirectMode(true)}
                >
                  <MonitorIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Direct Mode</span>
                  <Badge variant="secondary" className="text-xs">
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
                  <Badge variant="secondary" className="text-xs">
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

            {/* Count & Start Button */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-3">
                <PackageIcon className="text-muted-foreground h-5 w-5" />
                <div>
                  <span className="text-muted-foreground text-sm">Matching products:</span>
                  {isLoadingCount ? (
                    <Skeleton className="ml-2 inline-block h-6 w-16" />
                  ) : (
                    <span className="ml-2 text-xl font-bold">{matchingCount.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleStart}
                disabled={matchingCount === 0 || startJobMutation.isPending || isJobRunning}
                size="lg"
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
          </CardContent>
        </Card>

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
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
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
                    className={`flex items-center justify-between rounded-md border p-3 ${
                      activeJobId === job.id ? "border-primary bg-primary/5" : ""
                    }`}
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
                      <span className="text-muted-foreground text-xs">{new Date(job.startedAt).toLocaleString()}</span>
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
    </Layout>
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
