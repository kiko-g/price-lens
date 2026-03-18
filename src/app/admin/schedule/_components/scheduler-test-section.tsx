"use client"

import { useState } from "react"
import axios from "axios"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PriorityBubble } from "@/components/products/PriorityBubble"

import {
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
  TestTube2Icon,
  ServerIcon,
  PackageIcon,
  GaugeIcon,
  InfoIcon,
  TrendingUpIcon,
  LayersIcon,
} from "lucide-react"

import type { SchedulerTestResult } from "@/app/admin/schedule/types"
import { PRIORITY_CONFIG } from "@/lib/business/priority"

export function SchedulerTestContent() {
  const [result, setResult] = useState<SchedulerTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setIsTesting(true)
    setError(null)
    try {
      const res = await axios.get("/api/scrape/scheduler?test=true&dry=true")
      setResult(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed")
      setResult(null)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">Dry run to see what the scheduler would do on next execution</p>
        <Button variant="outline" size="sm" onClick={runTest} disabled={isTesting}>
          {isTesting ? (
            <>
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <PlayCircleIcon className="h-4 w-4" />
              Run Test
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangleIcon className="h-4 w-4" />
            <span className="font-medium">Test Failed</span>
          </div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!result && !isTesting && !error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <TestTube2Icon className="text-muted-foreground mb-2 h-8 w-8" />
          <h4 className="font-medium">No test results yet</h4>
          <p className="text-muted-foreground text-sm">Click &quot;Run Test&quot; to see what the scheduler would do</p>
        </div>
      )}

      {isTesting && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {result && !isTesting && (
        <div className="space-y-4">
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <span className="font-medium text-violet-600 dark:text-violet-400">{result.message}</span>
              </div>
              <Badge variant="outline" className="border-violet-500 text-violet-600">
                {result.duration}ms
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <PackageIcon className="h-3.5 w-3.5" />
                Would Schedule
              </div>
              <p className="mt-1 text-2xl font-bold text-violet-600">{result.wouldSchedule.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <ServerIcon className="h-3.5 w-3.5" />
                Batches
              </div>
              <p className="mt-1 text-2xl font-bold">{result.batches}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <GaugeIcon className="h-3.5 w-3.5" />
                Batch Size
              </div>
              <p className="mt-1 text-2xl font-bold">{result.config.batchSize}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <InfoIcon className="h-3.5 w-3.5" />
                Environment
              </div>
              <p className="mt-1 text-lg font-bold">{result.nodeEnv}</p>
              <p className="text-muted-foreground text-xs">QStash: {result.hasQstashToken ? "✓" : "✗"}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <LayersIcon className="h-4 w-4 text-violet-500" />
                Dynamic Batching
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">Backlog Size</p>
                  <p className="text-lg font-bold">{result.dynamicBatching.backlogSize.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">Dynamic Max</p>
                  <p className="text-lg font-bold">{result.dynamicBatching.dynamicMaxBatches}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">Batches Used</p>
                  <p className="text-lg font-bold">{result.dynamicBatching.batchesUsed}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-xs">Reason</p>
                  <Badge variant="outline" className="mt-1">
                    {result.dynamicBatching.reason}
                  </Badge>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "rounded-lg border p-4",
                result.capacity.status === "critical" && "border-red-500 bg-red-50 dark:bg-red-950/20",
                result.capacity.status === "degraded" && "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
                result.capacity.status === "healthy" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
              )}
            >
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <TrendingUpIcon className="h-4 w-4" />
                Capacity:{" "}
                <Badge
                  variant={
                    result.capacity.status === "healthy"
                      ? "success"
                      : result.capacity.status === "degraded"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {result.capacity.status}
                </Badge>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/50 p-2 dark:bg-black/20">
                  <p className="text-muted-foreground text-xs">Required/Day</p>
                  <p className="text-lg font-bold">{result.capacity.requiredDailyScrapes.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/50 p-2 dark:bg-black/20">
                  <p className="text-muted-foreground text-xs">Capacity/Day</p>
                  <p className="text-lg font-bold">{result.capacity.availableDailyCapacity.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/50 p-2 dark:bg-black/20">
                  <p className="text-muted-foreground text-xs">Utilization</p>
                  <p className="text-lg font-bold">{result.capacity.utilizationPercent}%</p>
                </div>
                <div className="rounded-lg bg-white/50 p-2 dark:bg-black/20">
                  <p className="text-muted-foreground text-xs">{result.capacity.deficit > 0 ? "Deficit" : "Surplus"}</p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      result.capacity.deficit > 0 ? "text-red-600" : "text-emerald-600",
                    )}
                  >
                    {result.capacity.deficit > 0
                      ? `-${result.capacity.deficit.toLocaleString()}`
                      : `+${result.capacity.surplusPercent}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-medium">Priority Breakdown</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.byPriority)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([priority, count]) => (
                  <div key={priority} className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
                    <PriorityBubble priority={Number(priority)} size="sm" />
                    <span className="font-medium">{PRIORITY_CONFIG[priority]?.description}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </div>

          {result.sampleProducts.length > 0 && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-medium">Most Urgent Products (Sample)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">Product</th>
                      <th className="p-2 text-left font-medium">Priority</th>
                      <th className="p-2 text-right font-medium">Urgency Score</th>
                      <th className="p-2 text-right font-medium">Hours Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.sampleProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="p-2">
                          <span className="line-clamp-1">{product.name}</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <PriorityBubble priority={product.priority} size="xs" useDescription />
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              parseFloat(product.urgencyScore) > 5
                                ? "border-red-500 text-red-500"
                                : parseFloat(product.urgencyScore) > 2
                                  ? "border-amber-500 text-amber-500"
                                  : "border-emerald-500 text-emerald-500",
                            )}
                          >
                            {product.urgencyScore}x
                          </Badge>
                        </td>
                        <td className="text-muted-foreground p-2 text-right">
                          {parseFloat(product.hoursOverdue) > 8760
                            ? "Never scraped"
                            : `${parseFloat(product.hoursOverdue).toFixed(0)}h`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Urgency score = hours since last scrape / refresh threshold. Score {">"}1 means overdue.
              </p>
            </div>
          )}

          <div className="text-muted-foreground bg-muted/30 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            <ServerIcon className="h-3.5 w-3.5" />
            <span>Batch Worker:</span>
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono">{result.batchWorkerUrl}</code>
          </div>
        </div>
      )}
    </div>
  )
}
