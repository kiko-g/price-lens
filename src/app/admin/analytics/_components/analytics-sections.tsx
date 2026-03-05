"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  CircleDashedIcon,
  PackageIcon,
  ActivityIcon,
  DatabaseIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  LayersIcon,
  SparklesIcon,
  GaugeIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import type { AnalyticsSnapshotData } from "@/types/analytics"
import { PRIORITY_CONFIG } from "@/lib/business/priority"

const STORE_LOGOS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: ContinenteSvg,
  2: AuchanSvg,
  3: PingoDoceSvg,
}

// ---------------------------------------------------------------------------
// Reusable stat box
// ---------------------------------------------------------------------------

function StatBox({
  icon: Icon,
  label,
  value,
  detail,
  color,
  isLoading,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  detail?: string
  color?: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className={cn("mt-2 text-2xl font-bold", color)}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
      {detail && <p className="text-muted-foreground mt-1 text-xs">{detail}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Coverage bar (label + progress + percentage)
// ---------------------------------------------------------------------------

function CoverageRow({
  label,
  value,
  total,
  pct,
  isLoading,
}: {
  label: string
  value: number
  total: number
  pct: number
  isLoading?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="font-medium">
            {value.toLocaleString()} / {total.toLocaleString()} ({pct}%)
          </span>
        )}
      </div>
      {isLoading ? <Skeleton className="h-2 w-full" /> : <Progress value={pct} className="h-2" />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. Scrape Status
// ---------------------------------------------------------------------------

export function ScrapeStatusSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const ss = data?.scrape_status
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ActivityIcon className="text-foreground size-5" />
          Scrape Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox
            icon={CheckCircle2Icon}
            label="Available"
            value={ss?.available ?? 0}
            detail="Successfully scraped"
            color="text-emerald-500"
            isLoading={isLoading}
          />
          <StatBox
            icon={AlertTriangleIcon}
            label="Unavailable"
            value={ss?.unavailable ?? 0}
            detail="404'd / removed"
            color="text-amber-500"
            isLoading={isLoading}
          />
          <StatBox
            icon={CircleDashedIcon}
            label="Never Scraped"
            value={ss?.never_scraped ?? 0}
            detail="Awaiting first attempt"
            color="text-blue-500"
            isLoading={isLoading}
          />
          <StatBox
            icon={PackageIcon}
            label="Total Products"
            value={ss?.total ?? 0}
            detail="All store products"
            isLoading={isLoading}
          />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Availability Rate</span>
            {isLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span className="font-medium">{ss?.availability_rate ?? 0}%</span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress value={ss?.availability_rate ?? 0} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 2. Products by Store
// ---------------------------------------------------------------------------

export function StoreBreakdownSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DatabaseIcon className="text-foreground size-5" />
          Products by Store
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : (
            data?.per_store?.map((store) => {
              const Logo = STORE_LOGOS[store.origin_id]
              return (
                <div key={store.origin_id}>
                  <div className="mb-2 flex items-center justify-between">
                    <Logo className="h-6 w-20" />
                    <span className="font-semibold">{store.total.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <Progress value={store.availability_rate} className="h-2" />
                    <div className="flex gap-5 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">
                          {store.available.toLocaleString()} ({store.availability_rate}%)
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">Unavailable</span>
                        <span className="font-medium">
                          {store.unavailable.toLocaleString()} ({(100 - store.availability_rate).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 3. Scrape Freshness
// ---------------------------------------------------------------------------

const FRESHNESS_BANDS = [
  { key: "last_1h" as const, label: "< 1h", className: "bg-emerald-500" },
  { key: "last_1h_to_6h" as const, label: "1-6h", className: "bg-emerald-400" },
  { key: "last_6h_to_24h" as const, label: "6-24h", className: "bg-amber-400" },
  { key: "last_24h_to_48h" as const, label: "24-48h", className: "bg-amber-500" },
  { key: "older_48h" as const, label: "> 48h", className: "bg-red-400" },
  { key: "never" as const, label: "Never", className: "bg-muted-foreground/30" },
]

export function ScrapeFreshnessSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const freshness = data?.scrape_freshness
  const total = freshness ? Object.values(freshness).reduce((a, b) => a + b, 0) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClockIcon className="text-foreground size-5" />
          Scrape Freshness
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stacked horizontal bar */}
            <div className="flex h-6 w-full overflow-hidden rounded-full">
              {FRESHNESS_BANDS.map((band) => {
                const count = freshness?.[band.key] ?? 0
                const pct = total > 0 ? (count / total) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={band.key}
                    className={cn("h-full transition-all", band.className)}
                    style={{ width: `${pct}%` }}
                    title={`${band.label}: ${count.toLocaleString()} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {FRESHNESS_BANDS.map((band) => {
                const count = freshness?.[band.key] ?? 0
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={band.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", band.className)} />
                      <span className="text-muted-foreground">{band.label}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {count.toLocaleString()}{" "}
                      <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Velocity */}
            {data?.scrape_velocity && (
              <div className="bg-muted/50 mt-2 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg scrape velocity (24h)</span>
                  <span className="font-semibold">{data.scrape_velocity.avg_per_hour_24h.toLocaleString()} / hr</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 4. Price Intelligence
// ---------------------------------------------------------------------------

export function PriceIntelligenceSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const pi = data?.price_intelligence
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUpIcon className="text-foreground size-5" />
          Price Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            icon={BarChart3Icon}
            label="Price Points"
            value={pi?.total_price_points ?? 0}
            detail="Historical records"
            isLoading={isLoading}
          />
          <StatBox
            icon={SparklesIcon}
            label="New (24h)"
            value={pi?.new_prices_24h ?? 0}
            detail={`${(pi?.new_prices_7d ?? 0).toLocaleString()} in 7d`}
            isLoading={isLoading}
          />
          <StatBox
            icon={TrendingUpIcon}
            label="Increases (24h)"
            value={pi?.increases_24h ?? 0}
            color="text-red-500"
            isLoading={isLoading}
          />
          <StatBox
            icon={TrendingDownIcon}
            label="Decreases (24h)"
            value={pi?.decreases_24h ?? 0}
            color="text-emerald-500"
            isLoading={isLoading}
          />
        </div>
        {!isLoading && pi && (
          <div className="bg-muted/50 mt-4 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Products on discount</span>
              <span className="font-semibold">{pi.products_with_discount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 5. Data Quality
// ---------------------------------------------------------------------------

export function DataQualitySection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const dq = data?.data_quality
  const total = data?.scrape_status?.total ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheckIcon className="text-foreground size-5" />
          Data Quality
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <CoverageRow
            label="Barcode"
            value={dq?.with_barcode ?? 0}
            total={total}
            pct={dq?.barcode_coverage_pct ?? 0}
            isLoading={isLoading}
          />
          <CoverageRow
            label="Canonical Product"
            value={dq?.with_canonical ?? 0}
            total={total}
            pct={dq?.canonical_match_rate ?? 0}
            isLoading={isLoading}
          />
          <CoverageRow
            label="Trade Item"
            value={dq?.with_trade_item ?? 0}
            total={total}
            pct={dq?.trade_item_coverage ?? 0}
            isLoading={isLoading}
          />
          <CoverageRow
            label="Category"
            value={dq?.with_category ?? 0}
            total={total}
            pct={dq?.category_coverage_pct ?? 0}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 6. Priority Distribution
// ---------------------------------------------------------------------------

const PRIORITY_DISTRIBUTION_KEYS: Array<{
  configKey: string
  dataKey: keyof AnalyticsSnapshotData["priority_distribution"]
}> = [
  { configKey: "5", dataKey: "p5" },
  { configKey: "4", dataKey: "p4" },
  { configKey: "3", dataKey: "p3" },
  { configKey: "2", dataKey: "p2" },
  { configKey: "1", dataKey: "p1" },
  { configKey: "0", dataKey: "p0" },
  { configKey: "null", dataKey: "unassigned" },
]

export function PriorityDistributionSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const pd = data?.priority_distribution
  const total = data?.scrape_status?.total ?? 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayersIcon className="text-foreground size-5" />
          Priority Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {PRIORITY_DISTRIBUTION_KEYS.map(({ configKey, dataKey }) => {
              const config = PRIORITY_CONFIG[configKey]
              const count = pd?.[dataKey] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={dataKey} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-10 text-sm">
                    {configKey === "null" ? "None" : `P${configKey}`}
                  </span>
                  <div className="bg-muted h-5 flex-1 overflow-hidden rounded">
                    <div className={cn("h-full rounded transition-all", config.bgClass)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right text-sm font-medium tabular-nums">{count.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 7. Growth
// ---------------------------------------------------------------------------

export function GrowthSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const g = data?.growth
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SparklesIcon className="text-foreground size-5" />
          Growth (7 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            icon={PackageIcon}
            label="New Products"
            value={g?.new_products_7d ?? 0}
            detail="Added in last 7 days"
            isLoading={isLoading}
          />
          <StatBox
            icon={TrendingUpIcon}
            label="New Prices"
            value={g?.new_prices_7d ?? 0}
            detail="Recorded in last 7 days"
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 8. Scheduler Capacity
// ---------------------------------------------------------------------------

const CAPACITY_STATUS_CONFIG = {
  healthy: {
    label: "Healthy",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-500",
    badgeVariant: "success" as const,
  },
  degraded: {
    label: "Degraded",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-500",
    badgeVariant: "warning" as const,
  },
  critical: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-500",
    badgeVariant: "destructive" as const,
  },
}

export function SchedulerCapacitySection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const cap = data?.scheduler_capacity
  const statusCfg = cap ? CAPACITY_STATUS_CONFIG[cap.status] : CAPACITY_STATUS_CONFIG.healthy

  return (
    <Card className={cn(!isLoading && cap && statusCfg.borderColor, !isLoading && cap && statusCfg.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", !isLoading && cap && statusCfg.color)}>
            <GaugeIcon className="size-5" />
            Scheduler Capacity
          </CardTitle>
          {!isLoading && cap && <Badge variant={statusCfg.badgeVariant}>{cap.utilization_pct}% utilization</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : cap ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <TrendingUpIcon className="h-3.5 w-3.5" />
                  Required Daily
                </div>
                <p className="mt-1 text-xl font-bold">{cap.required_daily_scrapes.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs">scrapes/day</p>
              </div>
              <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <GaugeIcon className="h-3.5 w-3.5" />
                  Available Capacity
                </div>
                <p className="mt-1 text-xl font-bold">{cap.available_daily_capacity.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs">scrapes/day</p>
              </div>
              {cap.deficit > 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <TrendingDownIcon className="h-3.5 w-3.5" />
                    Daily Deficit
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                    -{cap.deficit.toLocaleString()}
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
                    +{cap.surplus_pct.toFixed(0)}%
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">extra capacity</p>
                </div>
              )}
              <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">Config</div>
                <p className="mt-1 text-sm font-medium">
                  {cap.config.batch_size} &times; {cap.config.max_batches}
                </p>
                <p className="text-muted-foreground text-xs">
                  every {cap.config.cron_frequency_minutes}m ({cap.config.runs_per_day} runs/day)
                </p>
              </div>
            </div>
            {cap.status === "critical" && (
              <div className="rounded-lg border border-red-200 bg-red-100 p-3 dark:border-red-900 dark:bg-red-950/50">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  System cannot keep up with scraping demands. Products will accumulate staleness.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 9. Scrape Runs (24h)
// ---------------------------------------------------------------------------

export function ScrapeRunsSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const runs = data?.scrape_runs_24h
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ZapIcon className="text-foreground size-5" />
          Actual Throughput (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox icon={ActivityIcon} label="Batches Run" value={runs?.total_batches ?? 0} isLoading={isLoading} />
          <StatBox
            icon={PackageIcon}
            label="Products Scraped"
            value={runs?.total_products ?? 0}
            detail={
              runs
                ? `${runs.total_success.toLocaleString()} ok / ${runs.total_failed.toLocaleString()} failed`
                : undefined
            }
            isLoading={isLoading}
          />
          <StatBox
            icon={CheckCircle2Icon}
            label="Success Rate"
            value={runs ? `${runs.success_rate}%` : "0%"}
            color={
              runs
                ? runs.success_rate >= 90
                  ? "text-emerald-600"
                  : runs.success_rate >= 70
                    ? "text-amber-600"
                    : "text-red-600"
                : undefined
            }
            isLoading={isLoading}
          />
          <StatBox
            icon={ClockIcon}
            label="Avg Batch Duration"
            value={runs ? `${(runs.avg_batch_duration_ms / 1000).toFixed(1)}s` : "0s"}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 10. Staleness Breakdown
// ---------------------------------------------------------------------------

export function StalenessBreakdownSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const buckets = data?.staleness_breakdown

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangleIcon className="text-foreground size-5" />
          Staleness Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : buckets && buckets.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {buckets.map((bucket, idx) => {
              const isNever = bucket.min === null && bucket.max === null
              const severity =
                isNever || (bucket.min !== null && bucket.min >= 72)
                  ? "high"
                  : bucket.min !== null && bucket.min >= 24
                    ? "medium"
                    : "low"

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-lg border p-4",
                    severity === "high" && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
                    severity === "medium" && "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
                    severity === "low" &&
                      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{bucket.label}</span>
                    <span
                      className={cn(
                        "text-xl font-bold",
                        severity === "high" && "text-red-600 dark:text-red-400",
                        severity === "medium" && "text-amber-600 dark:text-amber-400",
                        severity === "low" && "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {bucket.count.toLocaleString()}
                    </span>
                  </div>
                  {bucket.count > 0 && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {Object.entries(bucket.by_priority)
                        .filter(([, count]) => count > 0)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([priority, count]) => (
                          <span key={priority} className="flex items-center gap-1">
                            <PriorityBubble priority={Number(priority)} size="xs" />
                            {count}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No staleness data available.</p>
        )}
      </CardContent>
    </Card>
  )
}
