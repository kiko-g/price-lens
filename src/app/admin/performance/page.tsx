"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PlayIcon,
  Loader2Icon,
  GaugeIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  DownloadIcon,
} from "lucide-react"
import { usePerformanceTest, type RouteMetrics } from "@/hooks/usePerformanceTest"
import { CATEGORY_LABELS, type TestableRoute } from "@/lib/performance/routes"
import { cn } from "@/lib/utils"

function getSpeedBadge(avgMs: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (avgMs < 200) return { label: "Fast", variant: "default" }
  if (avgMs < 500) return { label: "Medium", variant: "secondary" }
  return { label: "Slow", variant: "destructive" }
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "-"
  return `${ms.toLocaleString()}ms`
}

function RouteRow({
  route,
  metrics,
  isRunning,
  isCurrentRoute,
  onTest,
}: {
  route: TestableRoute
  metrics: RouteMetrics | undefined
  isRunning: boolean
  isCurrentRoute: boolean
  onTest: () => void
}) {
  const speed = metrics ? getSpeedBadge(metrics.avg) : null
  const hasError = metrics?.error || (metrics?.status && metrics.status >= 400)

  return (
    <TableRow className={cn(isCurrentRoute && "bg-muted/50")}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <code className="text-sm font-medium">{route.path}</code>
          <span className="text-muted-foreground text-xs">{route.description}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {CATEGORY_LABELS[route.category]}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {isCurrentRoute ? (
          <span className="text-muted-foreground">testing...</span>
        ) : (
          formatMs(metrics?.first)
        )}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {isCurrentRoute ? "-" : formatMs(metrics?.avg)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {isCurrentRoute ? "-" : formatMs(metrics?.min)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {isCurrentRoute ? "-" : formatMs(metrics?.max)}
      </TableCell>
      <TableCell>
        {metrics && !isCurrentRoute && (
          <div className="flex items-center gap-2">
            {hasError ? (
              <Badge variant="destructive" className="gap-1">
                <XCircleIcon className="size-3" />
                {metrics.status || "Error"}
              </Badge>
            ) : (
              <>
                <Badge variant={speed!.variant} className="gap-1">
                  <CheckCircle2Icon className="size-3" />
                  {speed!.label}
                </Badge>
                <span className="text-muted-foreground text-xs">{metrics.status}</span>
              </>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTest}
          disabled={isRunning}
          className="h-8 w-8 p-0"
        >
          {isCurrentRoute ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function PerformancePage() {
  const {
    results,
    isRunning,
    progress,
    runSingleTest,
    runAllTests,
    clearResults,
    getLastTestTime,
    routes,
  } = usePerformanceTest()

  const lastTestTime = getLastTestTime()
  const testedCount = Object.keys(results).length
  const totalRoutes = routes.length
  const progressPercent = progress.totalRoutes > 0
    ? (progress.completedRoutes / progress.totalRoutes) * 100
    : 0

  // calculate aggregate stats
  const avgTimes = Object.values(results).map((r) => r.avg).filter(Boolean)
  const overallAvg = avgTimes.length > 0
    ? Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length)
    : null
  const slowestRoute = Object.entries(results).sort((a, b) => b[1].avg - a[1].avg)[0]
  const fastestRoute = Object.entries(results).sort((a, b) => a[1].avg - b[1].avg)[0]

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: { testedCount, totalRoutes, overallAvg },
      routes: Object.entries(results).map(([path, metrics]) => ({
        path,
        ...metrics,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api-performance-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Performance Monitor</h1>
            <p className="text-muted-foreground text-sm">
              Test API response times to identify slow endpoints
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastTestTime && (
              <span className="text-muted-foreground text-xs">
                Last tested {format(new Date(lastTestTime), "MMM d, HH:mm")}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={downloadResults}
              disabled={isRunning || testedCount === 0}
            >
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearResults}
              disabled={isRunning || testedCount === 0}
            >
              <Trash2Icon className="size-4" />
              Clear
            </Button>
            <Button onClick={runAllTests} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <PlayIcon className="size-4" />
                  Test All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar (visible during test) */}
        {isRunning && progress.totalRoutes > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Testing {progress.currentRoute}
                  </span>
                  <span className="font-medium">
                    {progress.completedRoutes} / {progress.totalRoutes}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        {testedCount > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <GaugeIcon className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground text-sm">Routes Tested</span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {testedCount} / {totalRoutes}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ClockIcon className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground text-sm">Average Response</span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {overallAvg ? `${overallAvg}ms` : "-"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 text-emerald-500" />
                  <span className="text-muted-foreground text-sm">Fastest</span>
                </div>
                {fastestRoute ? (
                  <div className="mt-2">
                    <p className="text-xl font-bold text-emerald-500">{fastestRoute[1].avg}ms</p>
                    <p className="text-muted-foreground truncate text-xs">{fastestRoute[0]}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-2xl font-bold">-</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="size-4 text-red-500" />
                  <span className="text-muted-foreground text-sm">Slowest</span>
                </div>
                {slowestRoute ? (
                  <div className="mt-2">
                    <p className="text-xl font-bold text-red-500">{slowestRoute[1].avg}ms</p>
                    <p className="text-muted-foreground truncate text-xs">{slowestRoute[0]}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-2xl font-bold">-</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Routes Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GaugeIcon className="text-primary size-5" />
              API Routes ({totalRoutes})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Route</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">First</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <RouteRow
                      key={route.path}
                      route={route}
                      metrics={results[route.path]}
                      isRunning={isRunning}
                      isCurrentRoute={progress.currentRoute === route.path}
                      onTest={() => runSingleTest(route)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
