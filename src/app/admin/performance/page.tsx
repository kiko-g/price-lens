"use client"

import { format } from "date-fns"
import { usePerformanceTest, type RouteMetrics } from "@/hooks/usePerformanceTest"
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EXCLUDED_ROUTES,
  type TestableRoute,
  type RouteParam,
} from "@/lib/performance/routes"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge, type BadgeKind } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Code } from "@/components/ui/code"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

import {
  PlayIcon,
  Loader2Icon,
  GaugeIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  DownloadIcon,
  BanIcon,
} from "lucide-react"

function getSpeedBadge(avgMs: number): { label: string; variant: BadgeKind } {
  if (avgMs < 250) return { label: "Fast", variant: "success" }
  if (avgMs < 800) return { label: "Medium", variant: "default" }

  return { label: "Slow", variant: "warning" }
}

function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "-"
  return `${ms.toLocaleString()}ms`
}

function RouteParamInputs({
  route,
  params,
  paramOverrides,
  onUpdate,
}: {
  route: TestableRoute
  params: (RouteParam & { value: string | number | boolean })[]
  paramOverrides: Record<string, string | number | boolean>
  onUpdate: (overrides: Record<string, string | number | boolean>) => void
}) {
  if (params.length === 0) return null

  return (
    <div className="mt-2 flex w-full flex-wrap items-center gap-3">
      {params.map((param) => {
        const value = paramOverrides[param.name] ?? param.value
        const label = param.placeholder ?? param.name

        if (param.type === "boolean") {
          return (
            <div key={param.name} className="flex h-full items-center gap-2 self-center">
              <Checkbox
                id={`${route.path}-${param.name}`}
                checked={Boolean(value)}
                onCheckedChange={(checked) => onUpdate({ [param.name]: !!checked })}
                aria-label={label}
              />
              <Label htmlFor={`${route.path}-${param.name}`} className="text-muted-foreground cursor-pointer text-xs">
                {label}
              </Label>
            </div>
          )
        }

        if (param.type === "select") {
          return (
            <div key={param.name} className="flex min-w-[120px] flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{label}</Label>
              <Select value={String(value)} onValueChange={(v) => onUpdate({ [param.name]: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {param.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        return (
          <div key={param.name} className="flex min-w-[100px] flex-col gap-1">
            <Label className="text-muted-foreground text-xs">{label}</Label>
            <Input
              type={param.type === "number" ? "number" : "text"}
              value={typeof value === "boolean" ? "" : value}
              onChange={(e) => {
                const raw = e.target.value
                const next = param.type === "number" ? (raw === "" ? 0 : Number(raw)) : raw
                onUpdate({ [param.name]: next })
              }}
              placeholder={param.placeholder}
              className="h-8"
            />
          </div>
        )
      })}
    </div>
  )
}

function RouteBlock({
  route,
  metrics,
  isRunning,
  isCurrentRoute,
  resolvedUrl,
  paramOverrides,
  onUpdateParamOverride,
  onTest,
}: {
  route: TestableRoute
  metrics: RouteMetrics | undefined
  isRunning: boolean
  isCurrentRoute: boolean
  resolvedUrl: string
  paramOverrides: Record<string, string | number | boolean>
  onUpdateParamOverride: (overrides: Record<string, string | number | boolean>) => void
  onTest: () => void
}) {
  const speed = metrics ? getSpeedBadge(metrics.avg) : null
  const hasError = metrics?.error || (metrics?.status && metrics.status >= 400)

  const pathParams = route.pathParams ?? {}
  const queryParams = route.queryParams ?? []
  const allParams = [
    ...Object.entries(pathParams).map(([name, defaultVal]) => ({
      name,
      type: "string" as const,
      default: defaultVal,
      value: (paramOverrides[name] ?? defaultVal) as string,
      placeholder: name,
      options: undefined as { value: string; label: string }[] | undefined,
    })),
    ...queryParams.map((p) => ({
      ...p,
      value: (paramOverrides[p.name] ?? p.default) as string | number | boolean,
    })),
  ]

  return (
    <div
      className={cn(
        "bg-muted/20 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-start sm:justify-between",
        isCurrentRoute && "bg-muted/50",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 border-r pr-4">
        <div className="flex flex-col gap-1">
          <Code className="w-fit">{route.path}</Code>
          <span className="text-muted-foreground text-xs">{route.description}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[route.category]}
          </Badge>
          <span className="text-muted-foreground truncate font-mono text-xs">{resolvedUrl}</span>
        </div>
        <RouteParamInputs
          route={route}
          params={allParams}
          paramOverrides={paramOverrides}
          onUpdate={onUpdateParamOverride}
        />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 font-mono text-sm">
          <Badge variant="boring" size="xs">
            First:{" "}
            {isCurrentRoute ? <span className="text-muted-foreground">testing...</span> : formatMs(metrics?.first)}
          </Badge>
          <Badge variant="boring" size="xs">
            Avg: {isCurrentRoute ? "-" : formatMs(metrics?.avg)}
          </Badge>
          <Badge variant="boring" size="xs">
            Min: {isCurrentRoute ? "-" : formatMs(metrics?.min)}
          </Badge>
          <Badge variant="boring" size="xs">
            Max: {isCurrentRoute ? "-" : formatMs(metrics?.max)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {metrics && !isCurrentRoute && (
            <>
              {hasError ? (
                <Badge variant="destructive" className="items-center gap-1">
                  <XCircleIcon className="size-3" />
                  Error
                </Badge>
              ) : (
                <Badge variant={speed!.variant} className="items-center gap-1">
                  <CheckCircle2Icon className="size-3" />
                  {speed!.label}
                </Badge>
              )}
              <Badge variant="boring" size="xs">
                {metrics.status}
              </Badge>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onTest}
            disabled={isRunning}
            className="h-8 w-8 p-0"
            aria-label="Test route"
          >
            {isCurrentRoute ? <Loader2Icon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function groupRoutesByCategory(routes: TestableRoute[]): Map<TestableRoute["category"], TestableRoute[]> {
  const orderMap = Object.fromEntries(CATEGORY_ORDER.map((c, i) => [c, i]))
  const sorted = [...routes].sort((a, b) => {
    const catA = orderMap[a.category] ?? 99
    const catB = orderMap[b.category] ?? 99
    if (catA !== catB) return catA - catB
    return a.path.localeCompare(b.path)
  })
  const grouped = new Map<TestableRoute["category"], TestableRoute[]>()
  for (const route of sorted) {
    const list = grouped.get(route.category) ?? []
    list.push(route)
    grouped.set(route.category, list)
  }
  return grouped
}

export default function PerformancePage() {
  const {
    results,
    paramOverrides,
    updateParamOverride,
    isRunning,
    progress,
    runSingleTest,
    runAllTests,
    clearResults,
    getLastTestTime,
    resolveUrl,
    routes,
  } = usePerformanceTest()

  const lastTestTime = getLastTestTime()
  const testedCount = Object.keys(results).length
  const totalRoutes = routes.length
  const progressPercent = progress.totalRoutes > 0 ? (progress.completedRoutes / progress.totalRoutes) * 100 : 0

  const avgTimes = Object.values(results)
    .map((r) => r.avg)
    .filter(Boolean)
  const overallAvg = avgTimes.length > 0 ? Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) : null
  const slowestRoute = Object.entries(results).sort((a, b) => b[1].avg - a[1].avg)[0]
  const fastestRoute = Object.entries(results).sort((a, b) => a[1].avg - b[1].avg)[0]

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: { testedCount, totalRoutes, overallAvg },
      routes: Object.entries(results).map(([path, metrics]) => {
        const pathname = path.split("?")[0]
        const routePath = routes.find((r) => resolveUrl(r) === path)?.path ?? null
        return {
          path,
          pathname,
          routePath,
          ...metrics,
        }
      }),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api-performance-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const routesByCategory = groupRoutesByCategory(routes)

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Performance Monitor</h1>
            <p className="text-muted-foreground text-sm">Test API response times to identify slow endpoints</p>
          </div>
          <div className="flex items-center gap-3">
            {lastTestTime && (
              <span className="text-muted-foreground text-xs">
                Last tested {format(new Date(lastTestTime), "MMM d, HH:mm")}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={downloadResults} disabled={isRunning || testedCount === 0}>
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearResults} disabled={isRunning || testedCount === 0}>
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

        {isRunning && progress.totalRoutes > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">Testing {progress.currentRoute}</span>
                  <span className="font-medium">
                    {progress.completedRoutes} / {progress.totalRoutes}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="mt-2 text-2xl font-bold">{overallAvg ? `${overallAvg}ms` : "-"}</p>
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

        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <GaugeIcon className="text-primary size-7" />
            API Routes
            <Badge variant="boring">{totalRoutes}</Badge>
          </h2>

          <div className="space-y-12">
            {CATEGORY_ORDER.map((category) => {
              const categoryRoutes = routesByCategory.get(category)
              if (!categoryRoutes?.length) return null

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryRoutes.map((route) => {
                      const resolvedUrl = resolveUrl(route)
                      return (
                        <RouteBlock
                          key={route.path}
                          route={route}
                          metrics={results[resolvedUrl]}
                          isRunning={isRunning}
                          isCurrentRoute={progress.currentRoute === resolvedUrl}
                          resolvedUrl={resolvedUrl}
                          paramOverrides={paramOverrides[route.path] ?? {}}
                          onUpdateParamOverride={(overrides) => updateParamOverride(route.path, overrides)}
                          onTest={() => runSingleTest(route)}
                        />
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BanIcon className="text-muted-foreground size-5" />
              Routes Not Tested
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              These routes are excluded from performance testing (auth required, cron workers, or dev-only).
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EXCLUDED_ROUTES.map((r) => (
                <div key={r.path} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Code variant="destructive">{r.path}</Code>
                  <Badge variant="outline" className="text-xs">
                    {r.reason}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
