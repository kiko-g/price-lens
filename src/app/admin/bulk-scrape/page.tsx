"use client"

import axios from "axios"
import { useState, useEffect, useCallback, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAdminStoreProductFilters } from "@/hooks/useAdminStoreProductFilters"

import { cn } from "@/lib/utils"
import type {
  BulkScrapeResult,
  BulkScrapeJobCreated,
  BulkScrapeBatchResult,
  BulkScrapeError,
} from "@/lib/scrapers/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { PriorityBubble } from "@/components/products/PriorityBubble"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"

import {
  PlayIcon,
  SquareIcon,
  RefreshCwIcon,
  BarcodeIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  PackageIcon,
  Loader2Icon,
  AlertTriangleIcon,
  ServerIcon,
  MonitorIcon,
  CircleIcon,
  CircleCheckIcon,
  CircleXIcon,
  SettingsIcon,
  ActivityIcon,
  RotateCcwIcon,
  WifiOffIcon,
  TimerIcon,
  TrendingUpIcon,
  PercentIcon,
  LayersIcon,
  StoreIcon,
  MicroscopeIcon,
  PickaxeIcon,
} from "lucide-react"

/** Type guard to check if result is a batch result (not job creation) */
function isBatchResult(result: BulkScrapeResult): result is BulkScrapeBatchResult {
  return "batchSuccess" in result
}

// Store origin mapping for SVG logos
const STORE_ORIGINS = [
  { id: 1, name: "Continente", Logo: ContinenteSvg, hasBarcode: true },
  { id: 2, name: "Auchan", Logo: AuchanSvg, hasBarcode: true },
  { id: 3, name: "Pingo Doce", Logo: PingoDoceSvg, hasBarcode: false },
]

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

interface LogEntry {
  id: string
  timestamp: Date
  type: "info" | "success" | "error" | "warning" | "retry"
  message: string
}

interface EnhancedStats {
  totalProcessed: number
  totalFailed: number
  totalRetries: number
  networkErrors: number
  scrapeErrors: number
  barcodesFound: number
  startTime: Date | null
  avgTimePerProduct: number
  productsPerMinute: number
  successRate: number
}

export default function BulkScrapePage() {
  const queryClient = useQueryClient()

  // Use shared admin filters hook
  const {
    origins,
    priorities,
    missingBarcode,
    available,
    onlyUrl,
    setMissingBarcode,
    setAvailable,
    setOnlyUrl,
    toggleOrigin,
    togglePriority,
    filters,
    count,
    isLoadingCount,
    refetchCount,
    invalidateCount,
    priorityLevels,
  } = useAdminStoreProductFilters({
    initialFilters: {
      origins: [3],
      priorities: [],
      missingBarcode: true,
      available: null,
      onlyUrl: false,
    },
    queryKeyPrefix: "bulk-scrape",
  })

  const [useDirectMode, setUseDirectMode] = useState(true) // "direct" for local development
  const [isDirectProcessing, setIsDirectProcessing] = useState(false)
  const [useAntiBlock, setUseAntiBlock] = useState(false) // Anti-blocking measures (delays, rotating UA)
  const [batchSize, setBatchSize] = useState(5)
  const [jobLimit, setJobLimit] = useState<number | null>(null) // null = no limit, process all matching
  const [activeJobId, setActiveJobId] = useState<string | null>(null) // Active job tracking

  // Cancel state
  const cancelRequestedRef = useRef(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [inFlightCount, setInFlightCount] = useState(0)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Enhanced stats
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStats>({
    totalProcessed: 0,
    totalFailed: 0,
    totalRetries: 0,
    networkErrors: 0,
    scrapeErrors: 0,
    barcodesFound: 0,
    startTime: null,
    avgTimePerProduct: 0,
    productsPerMinute: 0,
    successRate: 100,
  })

  // Add log entry
  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    }
    setLogs((prev) => [...prev.slice(-199), entry]) // Keep last 200 logs
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // Wake Lock management
  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
        addLog("info", "Wake Lock acquired - screen will stay on")
        wakeLockRef.current.addEventListener("release", () => {
          addLog("warning", "Wake Lock released")
        })
      } catch (err) {
        addLog("warning", `Wake Lock failed: ${err}`)
      }
    }
  }, [addLog])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  // Fetch active jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["bulk-scrape-jobs"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/bulk-scrape?action=jobs")
      return res.data as { jobs: BulkScrapeJob[] }
    },
    staleTime: 60000,
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
      const timer = setTimeout(() => {
        refetchJobs()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [jobProgress?.status, refetchJobs])

  // Start job mutation (QStash mode)
  const startJobMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/admin/bulk-scrape", {
        origins: filters.origins,
        priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
        missingBarcode: filters.missingBarcode,
        available: filters.available,
        onlyUrl: filters.onlyUrl,
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
      cancelRequestedRef.current = true
      setIsCancelling(true)
      addLog("warning", "Cancel requested - waiting for current batch to finish...")
      await axios.delete(`/api/admin/bulk-scrape/${jobId}`)
    },
    onSuccess: () => {
      addLog("info", "Job cancelled successfully")
      refetchJobs()
    },
  })

  // Retry wrapper with exponential backoff
  const withRetry = useCallback(
    async <T,>(fn: () => Promise<T>, maxRetries: number = 3, context: string = "request"): Promise<T> => {
      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error as Error
          const isNetworkError =
            axios.isAxiosError(error) &&
            (!error.response || error.code === "ECONNABORTED" || error.code === "ERR_NETWORK")

          if (isNetworkError && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
            addLog(
              "retry",
              `${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay / 1000}s...`,
            )
            setEnhancedStats((prev) => ({
              ...prev,
              totalRetries: prev.totalRetries + 1,
              networkErrors: prev.networkErrors + 1,
            }))
            await new Promise((resolve) => setTimeout(resolve, delay))
          } else {
            throw error
          }
        }
      }

      throw lastError
    },
    [addLog],
  )

  // Direct mode: process batches continuously
  const processDirectBatch = useCallback<(jobId: string | null) => Promise<BulkScrapeResult>>(
    async (jobId: string | null) => {
      const payload = jobId
        ? { jobId, batchSize, useAntiBlock }
        : {
            origins: filters.origins,
            priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
            missingBarcode: filters.missingBarcode,
            available: filters.available,
            onlyUrl: filters.onlyUrl,
            batchSize,
            useAntiBlock,
            limit: jobLimit, // Cap total products to process (null = no limit)
          }

      return await withRetry(
        async () => {
          const res = await axios.patch("/api/admin/bulk-scrape", payload)
          return res.data
        },
        3,
        "Batch processing",
      )
    },
    [filters, batchSize, useAntiBlock, jobLimit, withRetry],
  )

  // Update enhanced stats
  const updateStats = useCallback((result: { processed?: number; failed?: number; barcodesFound?: number }) => {
    setEnhancedStats((prev) => {
      const newProcessed = prev.totalProcessed + (result.processed ?? 0)
      const newFailed = prev.totalFailed + (result.failed ?? 0)
      const newBarcodes = prev.barcodesFound + (result.barcodesFound ?? 0)

      const elapsedMs = prev.startTime ? Date.now() - prev.startTime.getTime() : 0
      const elapsedMinutes = elapsedMs / 60000

      return {
        ...prev,
        totalProcessed: newProcessed,
        totalFailed: newFailed,
        barcodesFound: newBarcodes,
        scrapeErrors: newFailed,
        avgTimePerProduct: newProcessed > 0 ? elapsedMs / newProcessed : 0,
        productsPerMinute: elapsedMinutes > 0 ? newProcessed / elapsedMinutes : 0,
        successRate: newProcessed > 0 ? ((newProcessed - newFailed) / newProcessed) * 100 : 100,
      }
    })
  }, [])

  // Direct mode continuous processing
  const startDirectMode = useCallback(async () => {
    setIsDirectProcessing(true)
    setIsCancelling(false)
    cancelRequestedRef.current = false
    setLogs([])
    setEnhancedStats({
      totalProcessed: 0,
      totalFailed: 0,
      totalRetries: 0,
      networkErrors: 0,
      scrapeErrors: 0,
      barcodesFound: 0,
      startTime: new Date(),
      avgTimePerProduct: 0,
      productsPerMinute: 0,
      successRate: 100,
    })

    let currentJobId: string | null = null

    // Request wake lock
    await requestWakeLock()

    addLog("info", `Starting bulk scrape with batch size ${batchSize}...`)

    try {
      // Use Web Locks API to maintain execution priority
      await navigator.locks.request("bulk-scrape-lock", async () => {
        // First call creates the job
        const firstResult = (await processDirectBatch(null)) as BulkScrapeJobCreated
        currentJobId = firstResult.jobId
        setActiveJobId(currentJobId)
        addLog("success", `Job ${currentJobId} created with ${firstResult.total} products`)

        let batchNumber = 1

        // Keep processing until complete
        while (true) {
          if (cancelRequestedRef.current) {
            addLog("warning", "Cancel acknowledged - stopping after current batch")
            break
          }

          // Check if job was cancelled/completed on server
          const job = await axios.get(`/api/admin/bulk-scrape/${currentJobId}`)
          if (job.data.status === "cancelled" || job.data.status === "completed") {
            addLog("info", `Job ${job.data.status}`)
            break
          }

          setInFlightCount(batchSize)
          const batchStartTime = Date.now()

          try {
            const result = await processDirectBatch(currentJobId)
            const batchDuration = Date.now() - batchStartTime

            // Type guard: ensure this is a batch result (not job creation)
            if (!isBatchResult(result)) {
              // Cast to generic to access potential status/message fields
              const response = result as unknown as Record<string, unknown>
              const status = response.status as string | undefined
              const message = response.message as string | undefined

              // Log the actual response for debugging
              const info = status
                ? `status: ${status}, message: ${message || "none"}`
                : `keys: ${Object.keys(result).join(", ")}`
              addLog("error", `Unexpected response type from batch processing (${info})`)

              // If job is finished, break the loop
              if (status === "completed" || status === "cancelled") {
                addLog("info", `Job ${status} on server`)
                break
              }
              continue
            }

            // Log batch results with detailed breakdown
            const {
              batchSuccess: success,
              batchUnavailable: unavailable,
              batchErrors: errors,
              batchBarcodesFound: barcodes,
              errors: errorDetails,
            } = result

            // Build detailed log message
            const parts = [`${success} ok`]
            if (unavailable > 0) parts.push(`${unavailable} unavailable`)
            if (errors > 0) parts.push(`${errors} errors`)
            if (barcodes > 0) parts.push(`${barcodes} barcodes`)

            const hasProblems = errors > 0 || unavailable === batchSize
            addLog(
              hasProblems ? "warning" : "success",
              `Batch #${batchNumber}: ${parts.join(", ")} (${batchDuration}ms)`,
            )

            // Log details for unavailable (warning) and errors (error) separately
            if (errorDetails.length > 0) {
              const unavailableItems = errorDetails.filter((e: BulkScrapeError) => e.status === "unavailable")
              const errorItems = errorDetails.filter((e: BulkScrapeError) => e.status === "error")

              // Log unavailable as warning (expected - products removed from store)
              if (unavailableItems.length > 0) {
                addLog("warning", `  └─ ${unavailableItems.length}x unavailable (404)`)
              }

              // Log actual errors (blocks, timeouts, etc.)
              if (errorItems.length > 0) {
                const errorsByType = errorItems.reduce(
                  (acc, err) => {
                    const key = err.statusCode ? `HTTP ${err.statusCode}` : "error"
                    acc[key] = (acc[key] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>,
                )
                const errorSummary = Object.entries(errorsByType)
                  .map(([type, count]) => `${count}x ${type}`)
                  .join(", ")
                addLog("error", `  └─ ${errorSummary}`)
              }
            }

            updateStats({
              processed: success + unavailable + errors,
              failed: unavailable + errors,
              barcodesFound: barcodes,
            })

            batchNumber++

            if (result.status === "completed") {
              addLog("success", "🎉 Job completed successfully!")
              break
            }
          } catch (error) {
            addLog("error", `Batch #${batchNumber} error: ${error}`)
            setEnhancedStats((prev) => ({ ...prev, totalFailed: prev.totalFailed + batchSize }))
          } finally {
            setInFlightCount(0)
          }

          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      })
    } catch (error) {
      addLog("error", `Direct mode error: ${error}`)
    } finally {
      setIsDirectProcessing(false)
      setIsCancelling(false)
      cancelRequestedRef.current = false
      setInFlightCount(0)
      releaseWakeLock()
      refetchJobs()
      if (currentJobId) {
        queryClient.invalidateQueries({ queryKey: ["bulk-scrape-progress", currentJobId] })
      }
      addLog("info", "Processing finished")
    }
  }, [batchSize, processDirectBatch, refetchJobs, queryClient, requestWakeLock, releaseWakeLock, addLog, updateStats])

  // Handle start button click
  const handleStart = useCallback(() => {
    if (useDirectMode) {
      startDirectMode()
    } else {
      startJobMutation.mutate()
    }
  }, [useDirectMode, startDirectMode, startJobMutation])

  const isJobRunning = jobProgress?.status === "running" || isDirectProcessing

  // Accordion default open values
  const defaultAccordionValues = [
    "batch-size",
    "job-limit",
    "more-options",
    "availability",
    "store-origin",
    "priority",
    "processing-mode",
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
      {/* Sidebar - Filters */}
      <aside className="flex h-auto min-h-0 flex-col border-b xl:h-full xl:w-[400px] xl:min-w-[400px] xl:shrink-0 xl:overflow-hidden xl:border-r xl:border-b-0">
        {/* Scrollable filters section */}
        <ScrollArea className="h-0 flex-1 p-4 xl:pb-36">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PickaxeIcon className="text-primary size-5" />
              <h2 className="text-lg font-bold">Bulk Scrape</h2>
            </div>

            <Button variant="outline" size="icon" onClick={() => refetchCount()}>
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full">
            {/* Batch Size */}
            <AccordionItem value="batch-size">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <LayersIcon className="h-4 w-4" />
                  Batch Size
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={batchSize}
                    onChange={(e) => setBatchSize(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="w-20"
                    disabled={isJobRunning}
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3, 5, 8, 10, 15].map((size) => (
                      <Button
                        key={size}
                        variant={batchSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBatchSize(size)}
                        disabled={isJobRunning}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Job Limit */}
            <AccordionItem value="job-limit">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex flex-1 items-center gap-2">
                  <PackageIcon className="h-4 w-4" />
                  Job Limit
                </div>
                {jobLimit !== null && (
                  <Badge variant="secondary" size="2xs">
                    {jobLimit.toLocaleString()}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-px">
                    <Input
                      type="number"
                      min={1}
                      placeholder="No limit"
                      value={jobLimit ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setJobLimit(val === "" ? null : Math.max(1, parseInt(val) || 1))
                      }}
                      className="w-24"
                      disabled={isJobRunning}
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: null, label: "All" },
                        { value: 100, label: "100" },
                        { value: 500, label: "500" },
                        { value: 1000, label: "1k" },
                        { value: 2000, label: "2k" },
                      ].map(({ value: limit, label }) => (
                        <Button
                          key={limit}
                          variant={jobLimit === limit ? "default" : "outline"}
                          size="sm"
                          onClick={() => setJobLimit(limit)}
                          disabled={isJobRunning}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-xs">
                    Maximum products to process in this job. Leave empty for no limit.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* More Options Filter */}
            <AccordionItem value="more-options">
              <AccordionTrigger className="w-full cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex flex-1 items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  More Options
                </div>
                {(missingBarcode || onlyUrl) && (
                  <Badge variant="secondary" className="text-xs" size="2xs">
                    {[missingBarcode && "No barcode", onlyUrl && "Only URL"].filter(Boolean).join(", ")}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={onlyUrl} onCheckedChange={() => setOnlyUrl(!onlyUrl)} />
                    <span className="text-sm">Only products with URL (no data scraped)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={missingBarcode} onCheckedChange={() => setMissingBarcode(!missingBarcode)} />
                    <span className="text-sm">Only products missing barcode</span>
                  </label>
                  <div className="border-t pt-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox checked={useAntiBlock} onCheckedChange={() => setUseAntiBlock(!useAntiBlock)} />
                      <span className="text-sm">Anti-blocking (slower but safer)</span>
                    </label>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Adds random delays and rotates User-Agent to avoid IP blocks. Disable for faster scraping if not
                      getting blocked.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Availability Filter */}
            <AccordionItem value="availability">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex flex-1 items-center gap-2">
                  <CircleCheckIcon className="h-4 w-4" />
                  Availability
                </div>
                {available !== null && (
                  <Badge variant="secondary" className="text-xs" size="2xs">
                    {available ? "Available" : "Unavailable"}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
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
              </AccordionContent>
            </AccordionItem>

            {/* Store Origin Filter */}
            <AccordionItem value="store-origin">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <StoreIcon className="h-4 w-4" />
                    Store Origin
                  </div>
                  {origins.length > 0 && <span className="text-muted-foreground text-xs">({origins.length})</span>}
                </div>
                {origins.length > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      origins.forEach((o) => toggleOrigin(o))
                    }}
                    className="text-muted-foreground hover:text-foreground mr-2 text-xs underline-offset-2 hover:underline"
                  >
                    Clear
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-2">
                  {STORE_ORIGINS.map((origin) => (
                    <div key={origin.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`origin-${origin.id}`}
                        checked={origins.includes(origin.id)}
                        onCheckedChange={() => toggleOrigin(origin.id)}
                      />
                      <Label
                        htmlFor={`origin-${origin.id}`}
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <origin.Logo className="h-4 min-h-4 w-auto" />
                        {!origin.hasBarcode && (
                          <Badge variant="destructive" className="ml-auto text-xs" size="2xs">
                            No EAN
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Priority Filter */}
            <AccordionItem value="priority">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <MicroscopeIcon className="h-4 w-4" />
                    <span>Priority Level</span>
                  </div>
                  {priorities.length > 0 && (
                    <span className="text-muted-foreground text-xs">({priorities.length})</span>
                  )}
                </div>
                {priorities.length > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      priorities.forEach((p) => togglePriority(p))
                    }}
                    className="text-muted-foreground hover:text-foreground mr-2 text-xs underline-offset-2 hover:underline"
                  >
                    Clear
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
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
                  <p className="text-muted-foreground mt-2 text-xs">All priorities will be included</p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Processing Mode - Always at top */}
            <AccordionItem value="processing-mode">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Processing Mode
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-2">
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                      useDirectMode ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    )}
                    onClick={() => setUseDirectMode(true)}
                  >
                    <MonitorIcon className="h-4 w-4" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Direct Mode</span>
                      <p className="text-muted-foreground text-xs">Processes in browser. Best for local development.</p>
                    </div>
                    <Badge variant="secondary" className="text-xs" size="2xs">
                      Local Dev
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                      !useDirectMode ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    )}
                    onClick={() => setUseDirectMode(false)}
                  >
                    <ServerIcon className="h-4 w-4" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">QStash Mode</span>
                      <p className="text-muted-foreground text-xs">Async queue processing. Requires public URL.</p>
                    </div>
                    <Badge variant="secondary" className="text-xs" size="2xs">
                      Production
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>

        {/* Fixed Count & Start Button */}
        <div className="bg-accent bottom-0 z-50 flex shrink-0 flex-col border-t! p-4 xl:fixed xl:bottom-0 xl:left-0 xl:ml-(--sidebar-width) xl:w-[400px] xl:border-t-0 xl:border-r">
          <div className="bg-background flex flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2">
              <PackageIcon className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">Matching</span>
            </div>
            {isLoadingCount ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-lg font-bold">{count.toLocaleString()}</span>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={count === 0 || startJobMutation.isPending || isJobRunning}
            className="mt-3 w-full"
          >
            {startJobMutation.isPending || isDirectProcessing ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {isDirectProcessing ? "Processing..." : "Starting..."}
              </>
            ) : isJobRunning ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Job Running...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Start Scrape
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-96 flex-1 overflow-y-auto p-4 xl:min-h-0 xl:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Live Progress */}
          {(jobProgress || isDirectProcessing) && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {(jobProgress?.status === "running" || isDirectProcessing) && (
                      <Loader2Icon className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {jobProgress?.status === "completed" && <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />}
                    {jobProgress?.status === "cancelled" && <XCircleIcon className="h-5 w-5 text-amber-500" />}
                    {jobProgress?.status === "failed" && <AlertTriangleIcon className="h-5 w-5 text-red-500" />}
                    Job {jobProgress?.id || activeJobId || "Starting..."}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      size="xs"
                      variant={
                        jobProgress?.status === "running" || isDirectProcessing
                          ? "default"
                          : jobProgress?.status === "completed"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {isDirectProcessing ? "running" : jobProgress?.status}
                    </Badge>
                    {(jobProgress?.status === "running" || isDirectProcessing) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activeJobId && cancelJobMutation.mutate(activeJobId)}
                        disabled={cancelJobMutation.isPending || isCancelling}
                      >
                        <SquareIcon className="h-3 w-3" />
                        {isCancelling
                          ? inFlightCount > 0
                            ? `Waiting (${inFlightCount} items)...`
                            : "Cancelling..."
                          : "Cancel"}
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
                      {(jobProgress?.processed ?? enhancedStats.totalProcessed).toLocaleString()} /{" "}
                      {(jobProgress?.total ?? count).toLocaleString()}
                      <span className="text-muted-foreground ml-1">
                        (
                        {(jobProgress?.stats?.progress ?? Math.round((enhancedStats.totalProcessed / count) * 100)) ||
                          0}
                        %)
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={
                      (jobProgress?.stats?.progress ?? Math.round((enhancedStats.totalProcessed / count) * 100)) || 0
                    }
                    className="h-3"
                  />
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
                  <StatCard
                    icon={<PackageIcon className="h-4 w-4" />}
                    label="Processed"
                    value={(jobProgress?.processed ?? enhancedStats.totalProcessed).toLocaleString()}
                    color="text-blue-500"
                  />
                  <StatCard
                    icon={<XCircleIcon className="h-4 w-4" />}
                    label="Failed"
                    value={(jobProgress?.failed ?? enhancedStats.totalFailed).toLocaleString()}
                    color="text-red-500"
                  />
                  <StatCard
                    icon={<BarcodeIcon className="h-4 w-4" />}
                    label="Barcodes"
                    value={(jobProgress?.barcodesFound ?? enhancedStats.barcodesFound).toLocaleString()}
                    color="text-emerald-500"
                  />
                  <StatCard
                    icon={<PercentIcon className="h-4 w-4" />}
                    label="Success Rate"
                    value={`${enhancedStats.successRate.toFixed(1)}%`}
                    color="text-purple-500"
                  />
                  <StatCard
                    icon={<RotateCcwIcon className="h-4 w-4" />}
                    label="Retries"
                    value={enhancedStats.totalRetries.toLocaleString()}
                    color="text-amber-500"
                  />
                  <StatCard
                    icon={<TrendingUpIcon className="h-4 w-4" />}
                    label="Rate"
                    value={jobProgress?.stats?.rate ?? `${enhancedStats.productsPerMinute.toFixed(1)}/min`}
                    color="text-cyan-500"
                  />
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard
                    icon={<TimerIcon className="h-4 w-4" />}
                    label="Avg Time"
                    value={`${(enhancedStats.avgTimePerProduct / 1000).toFixed(2)}s`}
                    color="text-indigo-500"
                    small
                  />
                  <StatCard
                    icon={<WifiOffIcon className="h-4 w-4" />}
                    label="Network Errors"
                    value={enhancedStats.networkErrors.toLocaleString()}
                    color="text-orange-500"
                    small
                  />
                  <StatCard
                    icon={<AlertTriangleIcon className="h-4 w-4" />}
                    label="Scrape Errors"
                    value={enhancedStats.scrapeErrors.toLocaleString()}
                    color="text-red-400"
                    small
                  />
                  <StatCard
                    icon={<ClockIcon className="h-4 w-4" />}
                    label="ETA"
                    value={
                      jobProgress?.stats?.etaSeconds
                        ? formatDuration(jobProgress.stats.etaSeconds)
                        : enhancedStats.productsPerMinute > 0
                          ? formatDuration(
                              Math.round(
                                ((count - enhancedStats.totalProcessed) / enhancedStats.productsPerMinute) * 60,
                              ),
                            )
                          : "—"
                    }
                    color="text-teal-500"
                    small
                  />
                </div>

                {/* Time Info */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Started:{" "}
                    {enhancedStats.startTime?.toLocaleTimeString() ??
                      (jobProgress?.startedAt ? new Date(jobProgress.startedAt).toLocaleTimeString() : "—")}
                  </span>
                  {enhancedStats.startTime && (
                    <span>
                      Elapsed: {formatDuration(Math.round((Date.now() - enhancedStats.startTime.getTime()) / 1000))}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Logs */}
          {(isDirectProcessing || logs.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5" />
                  Live Activity Log
                </div>
                <Badge variant="outline" className="ml-auto">
                  {logs.length} entries
                </Badge>
              </div>

              <ScrollArea className="bg-muted/30 h-64 w-full rounded-md border p-3">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-start gap-2",
                        log.type === "error" && "text-red-500",
                        log.type === "success" && "text-emerald-500",
                        log.type === "warning" && "text-amber-500",
                        log.type === "retry" && "text-orange-400",
                        log.type === "info" && "text-muted-foreground",
                      )}
                    >
                      <span className="shrink-0 opacity-60">{log.timestamp.toLocaleTimeString()}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1",
                          log.type === "error" && "bg-red-500/20",
                          log.type === "success" && "bg-emerald-500/20",
                          log.type === "warning" && "bg-amber-500/20",
                          log.type === "retry" && "bg-orange-500/20",
                          log.type === "info" && "bg-muted",
                        )}
                      >
                        {log.type.toUpperCase()}
                      </span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty state when no job is running */}
          {!jobProgress && !isDirectProcessing && logs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <PackageIcon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-medium">No Active Job</h3>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                  Configure your filters in the sidebar and click &quot;Start Scrape&quot; to begin processing products.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Jobs */}
          {jobsData?.jobs && jobsData.jobs.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="recent-jobs">
                <AccordionTrigger className="bg-accent mb-2 cursor-pointer justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Recent Jobs
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-2">
                    {jobsData.jobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-md border p-3 xl:flex-row xl:items-center xl:justify-between",
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
  small = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  small?: boolean
}) {
  return (
    <div className={cn("rounded-md p-3", small ? "bg-muted/30" : "bg-muted/50")}>
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className={cn("font-medium uppercase", small ? "text-[10px]" : "text-xs")}>{label}</span>
      </div>
      <div className={cn("mt-1 font-bold", small ? "text-base" : "text-xl")}>{value}</div>
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
