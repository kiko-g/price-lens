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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { AnalyticsSnapshotData } from "@/types/analytics"
import { Cell, Pie, PieChart } from "recharts"
import {
  PRIORITY_CONFIG,
  PRIORITY_DISTRIBUTION_KEYS,
  formatThreshold,
  getPriorityDistributionStyle,
} from "@/lib/business/priority"
import { BanIcon, CircleIcon, FilterXIcon } from "lucide-react"

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
            icon={FilterXIcon}
            label="Vetoed products"
            value={ss?.vetoed ?? 0}
            detail="Excluded products by canonical category"
            color="text-zinc-500"
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
                    <div className="flex w-full flex-wrap justify-between gap-x-5 gap-y-1 text-xs">
                      <div className="flex items-start gap-2">
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

                      {(store.vetoed ?? 0) > 0 && (
                        <span className="text-warning flex items-center gap-1">
                          <span className="text-muted-foreground">Vetoed</span>
                          <span className="font-medium">{store.vetoed.toLocaleString()}</span>
                        </span>
                      )}
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
  { key: "within_24h" as const, label: "< 24h", detail: "P5", className: "bg-emerald-600", fill: "#059669" },
  { key: "within_48h" as const, label: "1-2d", detail: "P4", className: "bg-sky-500", fill: "#0ea5e9" },
  { key: "within_3d" as const, label: "2-3d", detail: "P3", className: "bg-amber-500", fill: "#f59e0b" },
  { key: "within_7d" as const, label: "3-7d", detail: "P2", className: "bg-orange-500", fill: "#f97316" },
  { key: "within_14d" as const, label: "7-14d", detail: "P1", className: "bg-fuchsia-500", fill: "#d946ef" },
  { key: "older_14d" as const, label: "> 14d", detail: null, className: "bg-red-600", fill: "#dc2626" },
  { key: "never" as const, label: "Never", detail: null, className: "bg-slate-600", fill: "#475569" },
]

function pieTooltipFormatter(value: unknown, _name: unknown, _item: unknown, _index: unknown, payload: unknown) {
  const pct = (payload as { pct?: number } | undefined)?.pct
  return (
    <span>
      {typeof value === "number" ? value.toLocaleString() : String(value)}
      {pct != null && ` (${pct.toFixed(1)}%)`}
    </span>
  )
}

export function ScrapeFreshnessSection({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsSnapshotData
  isLoading: boolean
  className?: string
}) {
  const freshness = data?.scrape_freshness
  const totalFreshness = freshness ? Object.values(freshness).reduce((a, b) => a + b, 0) : 0
  const dist = data?.priority_distribution
  const totalPriority = dist != null ? dist.p0 + dist.p1 + dist.p2 + dist.p3 + dist.p4 + dist.p5 + dist.unassigned : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClockIcon className="text-foreground size-5" />
          Scrape Freshness & Priority
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Scrape Freshness */}
            <div className="space-y-4">
              <h4 className="text-muted-foreground text-sm font-medium">Scrape Freshness</h4>
              {totalFreshness > 0 ? (
                <ChartContainer
                  config={Object.fromEntries(
                    FRESHNESS_BANDS.map((b) => [
                      b.key,
                      { label: b.detail ? `${b.label} (${b.detail})` : b.label, color: b.fill },
                    ]),
                  )}
                  className="aspect-square h-44 w-full max-w-44"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={pieTooltipFormatter} />} />
                    <Pie
                      data={FRESHNESS_BANDS.filter((b) => (freshness?.[b.key] ?? 0) > 0).map((band) => {
                        const count = freshness?.[band.key] ?? 0
                        const pct = totalFreshness > 0 ? (count / totalFreshness) * 100 : 0
                        return {
                          name: band.detail ? `${band.label} (${band.detail})` : band.label,
                          value: count,
                          key: band.key,
                          fill: band.fill,
                          pct,
                        }
                      })}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      strokeWidth={1}
                      stroke="var(--background)"
                    >
                      {FRESHNESS_BANDS.filter((b) => (freshness?.[b.key] ?? 0) > 0).map((band) => (
                        <Cell key={band.key} fill={band.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="bg-muted/30 flex h-44 w-full max-w-44 items-center justify-center rounded-lg">
                  <span className="text-muted-foreground text-sm">No data</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                {FRESHNESS_BANDS.map((band) => {
                  const count = freshness?.[band.key] ?? 0
                  const pct = totalFreshness > 0 ? (count / totalFreshness) * 100 : 0
                  return (
                    <div key={band.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", band.className)} />
                        <span className="text-muted-foreground">
                          {band.label}
                          {band.detail && (
                            <span className="text-muted-foreground/60 ml-1 text-xs">({band.detail})</span>
                          )}
                        </span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {count.toLocaleString()}{" "}
                        <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              {data?.scrape_velocity && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg scrape velocity (24h)</span>
                    <span className="font-semibold">{data.scrape_velocity.avg_per_hour_24h.toLocaleString()} / hr</span>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="space-y-4">
              <h4 className="text-muted-foreground text-sm font-medium">Priority Distribution</h4>
              {totalPriority > 0 && dist ? (
                <>
                  <ChartContainer
                    config={Object.fromEntries(
                      PRIORITY_DISTRIBUTION_KEYS.map((key) => {
                        const style = getPriorityDistributionStyle(key)
                        return [key, { label: style.label, color: style.fill }]
                      }),
                    )}
                    className="aspect-square h-44 w-full max-w-44"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent formatter={pieTooltipFormatter} />} />
                      <Pie
                        data={PRIORITY_DISTRIBUTION_KEYS.filter((key) => (dist[key] ?? 0) > 0).map((key) => {
                          const style = getPriorityDistributionStyle(key)
                          const count = dist[key] ?? 0
                          const pct = totalPriority > 0 ? (count / totalPriority) * 100 : 0
                          return {
                            name: style.label,
                            value: count,
                            key,
                            fill: style.fill,
                            pct,
                          }
                        })}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        strokeWidth={1}
                        stroke="var(--background)"
                      >
                        {PRIORITY_DISTRIBUTION_KEYS.filter((key) => (dist[key] ?? 0) > 0).map((key) => (
                          <Cell key={key} fill={getPriorityDistributionStyle(key).fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                    {PRIORITY_DISTRIBUTION_KEYS.map((key) => {
                      const style = getPriorityDistributionStyle(key)
                      const count = dist[key] ?? 0
                      const pct = totalPriority > 0 ? (count / totalPriority) * 100 : 0
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", style.className)} />
                            <span className="text-muted-foreground">{style.label}</span>
                          </div>
                          <span className="font-medium tabular-nums">
                            {count.toLocaleString()}{" "}
                            <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-muted/30 flex h-44 w-full max-w-44 items-center justify-center rounded-lg">
                  <span className="text-muted-foreground text-sm">No data</span>
                </div>
              )}
            </div>
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

export function DataQualitySection({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsSnapshotData
  isLoading: boolean
  className?: string
}) {
  const dq = data?.data_quality
  const total = data?.scrape_status?.total ?? 0

  return (
    <Card className={className}>
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
// 6. Priority Health (merged Priority Distribution + Staleness)
// ---------------------------------------------------------------------------

export function PriorityHealthSection({ data, isLoading }: { data?: AnalyticsSnapshotData; isLoading: boolean }) {
  const stats = data?.priority_health

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayersIcon className="text-foreground size-5" />
            Priority Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.length === 0) return null

  const numbered = stats.filter((s) => s.priority !== null)
  const unclassified = stats.find((s) => s.priority === null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayersIcon className="text-foreground size-5" />
          Priority Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {numbered.map((stat) => (
            <PriorityHealthCard key={stat.priority} stat={stat} />
          ))}
          {unclassified && unclassified.total > 0 && (
            <div className="bg-accent col-span-1 flex items-center justify-between gap-2 rounded-lg border border-dashed p-4 opacity-80 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-2">
                <PriorityBubble priority={null} size="sm" />
                <span className="font-medium">Unclassified</span>
                <span className="text-muted-foreground text-sm">({unclassified.total.toLocaleString()} products)</span>
              </div>
              <Badge variant="default" className="text-xs" size="xs">
                Not scheduled
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityHealthCard({ stat }: { stat: AnalyticsSnapshotData["priority_health"][number] }) {
  const config = PRIORITY_CONFIG[stat.priority ?? 0]
  const freshPct = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0
  const stalePct = stat.total > 0 ? Math.round((stat.stale_actionable / stat.total) * 100) : 0
  const unavailPct = stat.total > 0 ? Math.round((stat.unavailable / stat.total) * 100) : 0

  return (
    <div className={cn("rounded-lg border p-4", !stat.is_active && "bg-accent border-dashed opacity-80")}>
      <div className="mb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PriorityBubble priority={stat.priority} size="sm" />
            <span className="font-medium">{config?.description}</span>
          </div>
          {!stat.is_active && (
            <Badge variant="default" className="text-xs" size="xs">
              Not scheduled
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">{stat.total.toLocaleString()} products</span>
          <span className="text-muted-foreground">Refresh: {formatThreshold(stat.staleness_threshold_hours)}</span>
        </div>
      </div>

      <div className="flex h-6 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        {stat.fresh > 0 && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                  style={{ width: `${freshPct}%` }}
                >
                  {freshPct > 10 && stat.fresh.toLocaleString()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stat.fresh.toLocaleString()} fresh ({freshPct}%)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {stat.stale_actionable > 0 && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center justify-center bg-orange-500 text-xs font-medium text-white transition-all"
                  style={{ width: `${stalePct}%` }}
                >
                  {stalePct > 10 && stat.stale_actionable.toLocaleString()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stat.stale_actionable.toLocaleString()} stale actionable ({stalePct}%)
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
                  style={{ width: `${unavailPct}%` }}
                >
                  {unavailPct > 10 && stat.unavailable.toLocaleString()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stat.unavailable.toLocaleString()} unavailable ({unavailPct}%)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs font-medium">
        <span className="text-success flex items-center gap-1">
          <CheckCircle2Icon className="h-4 w-4" />
          {stat.fresh.toLocaleString()} fresh ({freshPct}%)
        </span>
        {stat.stale_actionable > 0 && (
          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <AlertTriangleIcon className="h-4 w-4" />
            {stat.stale_actionable.toLocaleString()} stale actionable ({stalePct}%)
          </span>
        )}
        {stat.unavailable > 0 && (
          <span className="text-muted-foreground flex items-center gap-1">
            <BanIcon className="h-4 w-4" />
            {stat.unavailable.toLocaleString()} unavailable ({unavailPct}%)
          </span>
        )}
        {stat.never_scraped > 0 && (
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] opacity-70">
            <CircleIcon className="h-3 w-3" />
            {stat.never_scraped.toLocaleString()} never scraped
          </span>
        )}
      </div>
    </div>
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
                    −{cap.deficit.toLocaleString()}
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
