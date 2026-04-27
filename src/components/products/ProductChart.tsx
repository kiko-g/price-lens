"use client"

import Image from "next/image"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Fragment,
  type ReactNode,
  type RefObject,
} from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useActiveAxis } from "@/hooks/useActiveAxis"
import { useChartTouch } from "@/hooks/useChartTouch"
import { usePricesWithAnalytics } from "@/hooks/usePrices"
import { isLocale, type Locale } from "@/i18n/config"

import type { StoreProduct, ProductChartEntry, PricePoint } from "@/types"
import { RANGES, DateRange, daysAmountInRange } from "@/types/business"

import { cn } from "@/lib/utils"
import {
  buildChartData,
  chartConfig,
  calculateChartBounds,
  formatChartAxisTick,
  formatRelativeTime,
  type ChartSamplingMode,
} from "@/lib/business/chart"
import { discountValueToPercentage, formatDiscountPercentWithMinus, generateProductPath } from "@/lib/business/product"
import {
  CURRENT_ROW_MARKER,
  PRICE_PLACEHOLDER,
  formatEuroCompact,
  formatEuroPerMajorUnit,
  formatPercentFixed,
} from "@/lib/i18n/formatting-glyphs"
import { imagePlaceholder } from "@/lib/business/data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Barcode } from "@/components/ui/combo/barcode"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PriceFreshnessInfo } from "@/components/products/PriceFreshnessInfo"
import { PricesVariationCard } from "@/components/products/PricesVariationCard"

import { formatDistanceToNow } from "date-fns"
import {
  ArrowDownIcon,
  BarChart2Icon,
  BinocularsIcon,
  ChevronDownIcon,
  ImageIcon,
  InfoIcon,
  WifiOffIcon,
} from "lucide-react"

const FALLBACK_ACTIVE_DOT_RADIUS = 5
const CHART_TRANSITION_DURATION = 300

// ============================================================================
// Context Types
// ============================================================================

type ChartBounds = {
  floor: number
  ceiling: number
  tickInterval: number
  ticks: number[]
}

type ProductChartContextValue = {
  // Core data
  sp: StoreProduct
  chartData: ProductChartEntry[]
  pricePoints: PricePoint[] | null
  mostCommon: PricePoint | null
  chartBounds: ChartBounds

  // State
  activeAxis: string[]
  selectedRange: DateRange
  isLoading: boolean
  isTransitioning: boolean
  error: Error | null

  // Derived values
  trackingSince: string | null
  daysBetweenDates: number
  variations: {
    price: number
    priceRecommended: number
    pricePerMajorUnit: number
    discount: number
  }

  // Chart config
  samplingMode: ChartSamplingMode
  showDots: boolean
  baseDotRadius: number
  isMobile: boolean

  // Actions
  handleAxisChange: (axis: string) => void
  handleRangeChange: (range: DateRange) => void

  // Refs for touch handling
  chartRef: RefObject<HTMLDivElement | null>
  isTooltipActive: boolean
}

const ProductChartContext = createContext<ProductChartContextValue | null>(null)

function useProductChartContext() {
  const context = useContext(ProductChartContext)
  if (!context) {
    throw new Error("ProductChart compound components must be used within ProductChart.Root")
  }
  return context
}

// ============================================================================
// Root Component (Provider)
// ============================================================================

type RootProps = {
  children: ReactNode
  sp: StoreProduct
  defaultRange?: DateRange
  onRangeChange?: (range: DateRange) => void
  /** When set, reports analytics `pricePoints.length` so copy elsewhere can match the frequency table. */
  onPriceHistoryHint?: (hint: { loading: boolean; levels: number | null }) => void
  samplingMode?: ChartSamplingMode
  className?: string
}

function Root({
  children,
  sp,
  defaultRange = "1M",
  onRangeChange,
  onPriceHistoryHint,
  samplingMode = "hybrid",
  className,
}: RootProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const showDots = samplingMode === "efficient"
  const baseDotRadius = isMobile ? 2 : 0

  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange>(defaultRange)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeAxis, updateActiveAxis] = useActiveAxis()
  const pendingRangeRef = useRef<DateRange | null>(null)
  const { chartRef, isActive: isTooltipActive } = useChartTouch()

  const id = sp.id?.toString() || ""
  const isTracked = sp.priority != null && sp.priority > 0
  const { data, isLoading, error } = usePricesWithAnalytics(id, { enabled: isTracked })

  const prices = useMemo(() => data?.prices || [], [data?.prices])
  const analytics = data?.analytics || null
  const pricePoints = analytics?.pricePoints || null
  const mostCommon = analytics?.mostCommon || null

  const chartBounds = useMemo(() => {
    if (chartData.length === 0) {
      return { floor: 0, ceiling: 1, tickInterval: 0.5, ticks: [0, 0.5, 1] }
    }

    const visiblePrices = chartData
      .flatMap((p) => [
        activeAxis.includes("price") ? p.price : -Infinity,
        activeAxis.includes("price-recommended") ? p["price-recommended"] : -Infinity,
        activeAxis.includes("price-per-major-unit") ? p["price-per-major-unit"] : -Infinity,
      ])
      .filter((price) => price !== -Infinity && price > 0)

    if (visiblePrices.length === 0) {
      return { floor: 0, ceiling: 1, tickInterval: 0.5, ticks: [0, 0.5, 1] }
    }

    const min = Math.min(...visiblePrices)
    const max = Math.max(...visiblePrices)
    const bounds = calculateChartBounds(min, max)
    return bounds
  }, [chartData, activeAxis])

  const variations = useMemo(
    () => ({
      price: analytics?.variations.price || 0,
      priceRecommended: analytics?.variations.priceRecommended || 0,
      pricePerMajorUnit: analytics?.variations.pricePerMajorUnit || 0,
      discount: analytics?.variations.discount || 0,
    }),
    [analytics],
  )

  const daysBetweenDates = analytics?.dateRange.daysBetween || 0

  const updateChartData = useCallback(
    (range: DateRange) => {
      if (!prices || prices.length === 0) return
      const points = buildChartData(prices, { range, samplingMode })
      setChartData(points)
    },
    [prices, samplingMode],
  )

  useEffect(() => {
    if (!prices || prices.length === 0) return
    updateChartData(selectedRange)
  }, [prices]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const pendingRange = pendingRangeRef.current
    if (!pendingRange || !prices || prices.length === 0) return

    setIsTransitioning(true)

    const fadeOutTimer = setTimeout(() => {
      updateChartData(pendingRange)
      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false)
        pendingRangeRef.current = null
      }, 50)
      return () => clearTimeout(fadeInTimer)
    }, CHART_TRANSITION_DURATION)

    return () => clearTimeout(fadeOutTimer)
  }, [selectedRange, prices, updateChartData])

  const handleAxisChange = useCallback(
    (axis: string) => {
      const newAxis = activeAxis.includes(axis) ? activeAxis.filter((a) => a !== axis) : [...activeAxis, axis]
      updateActiveAxis(newAxis)
    },
    [activeAxis, updateActiveAxis],
  )

  const handleRangeChange = useCallback(
    (range: DateRange) => {
      if (range === selectedRange) return
      pendingRangeRef.current = range
      setSelectedRange(range)
      onRangeChange?.(range)
    },
    [selectedRange, onRangeChange],
  )

  const contextValue: ProductChartContextValue = {
    sp,
    chartData,
    pricePoints,
    mostCommon,
    chartBounds,
    activeAxis,
    selectedRange,
    isLoading,
    isTransitioning,
    error: error || null,
    trackingSince: analytics?.dateRange.minDate || null,
    daysBetweenDates,
    variations,
    samplingMode,
    showDots,
    baseDotRadius,
    isMobile,
    handleAxisChange,
    handleRangeChange,
    chartRef,
    isTooltipActive,
  }

  useEffect(() => {
    if (!onPriceHistoryHint) return
    if (!isTracked) {
      onPriceHistoryHint({ loading: false, levels: null })
      return
    }
    if (isLoading) {
      onPriceHistoryHint({ loading: true, levels: null })
      return
    }
    const levels = pricePoints?.length ?? 0
    onPriceHistoryHint({ loading: false, levels })
  }, [isTracked, isLoading, onPriceHistoryHint, pricePoints])

  return (
    <ProductChartContext.Provider value={contextValue}>
      <div className={cn("flex w-full min-w-0 flex-col", className)}>{children}</div>
    </ProductChartContext.Provider>
  )
}

// ============================================================================
// PricesVariation Component
// ============================================================================

type PricesVariationProps = {
  className?: string
  showImage?: boolean
  showBarcode?: boolean
  showFreshnessInfo?: boolean
  /** Widen the axis legend (e.g. desktop product page next to the chart). */
  wideCard?: boolean
}

function PricesVariation({
  className,
  showImage = false,
  showBarcode = false,
  showFreshnessInfo = true,
  wideCard = false,
}: PricesVariationProps) {
  const { sp, activeAxis, variations, handleAxisChange, isLoading } = useProductChartContext()

  if (isLoading) {
    return (
      <div className={cn("mb-2 flex items-start justify-between gap-3", className)}>
        <div className="flex flex-1 items-center justify-between gap-1 py-0.5">
          <div className="flex flex-col gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="flex items-center gap-2" key={i}>
                <div className="flex items-center gap-1.5">
                  <Skeleton variant="shimmer" className="size-4 rounded" />
                  <Skeleton variant="shimmer" className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton variant="shimmer" className="h-4 w-12" />
                  <Skeleton variant="shimmer" className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton variant="shimmer" className="h-20 w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("animate-fade-in-fast mb-2 flex items-start justify-between gap-3", className)}>
      <PricesVariationCard
        state={{ activeAxis }}
        data={{
          discountVariation: variations.discount,
          priceVariation: variations.price,
          priceRecommendedVariation: variations.priceRecommended,
          pricePerMajorUnitVariation: variations.pricePerMajorUnit,
          storeProduct: sp,
        }}
        options={{
          hideExtraInfo: !showImage,
          showFreshnessInfo: showFreshnessInfo,
        }}
        actions={{
          onPriceChange: () => handleAxisChange("price"),
          onPriceRecommendedChange: () => handleAxisChange("price-recommended"),
          onPricePerMajorUnitChange: () => handleAxisChange("price-per-major-unit"),
          onDiscountChange: () => handleAxisChange("discount"),
        }}
        className={cn("text-xs font-medium md:text-sm", wideCard ? "max-w-full" : "max-w-xs")}
      />

      {(showImage || showBarcode) && (
        <div className="flex w-28 flex-col items-center justify-center gap-3 md:w-30">
          {showImage && <ProductImage />}
          {showBarcode && <Barcode value={sp.barcode} height={10} width={1} />}
        </div>
      )}
    </div>
  )
}

function NotAvailableTooltipText() {
  const t = useTranslations("products.chart")
  return <>{t("notAvailableInStore")}</>
}

function NoAxisSelected() {
  const t = useTranslations("products.chart")
  return (
    <div className="flex h-60 w-full items-center justify-center">
      <p className="text-muted-foreground mb-4 text-sm">{t("noAxisSelected")}</p>
    </div>
  )
}

function ProductImage() {
  const { sp } = useProductChartContext()

  function resolveImageUrl(image: string, size = 400) {
    const url = new URL(image)
    const p = url.searchParams
    ;["sm", "w", "h", "sw", "sh"].forEach((k) => p.delete(k))
    p.set("sw", String(size))
    p.set("sh", String(size))
    p.set("sm", "fit")
    return url.toString()
  }

  if (!sp.image) {
    return (
      <div className="bg-muted flex aspect-square w-24 items-center justify-center rounded-md">
        <ImageIcon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <Link href={generateProductPath(sp)} target="_blank">
        <Image
          src={resolveImageUrl(sp.image, 400)}
          alt={sp.name}
          width={400}
          height={400}
          className={cn(
            "aspect-square size-28 rounded-md border bg-white object-contain p-0.5 transition-all duration-300 md:size-30",
            sp.available ? "opacity-100 hover:scale-105" : "grayscale hover:scale-105",
          )}
          placeholder="empty"
          blurDataURL={imagePlaceholder.productBlur}
          loading="lazy"
        />
      </Link>

      {!sp.available && (
        <div className="absolute top-1 left-1 flex flex-col gap-1">
          <Badge size="xs" variant="destructive">
            <TooltipProvider>
              <TooltipUI delayDuration={100}>
                <TooltipTrigger>
                  <WifiOffIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <NotAvailableTooltipText />
                </TooltipContent>
              </TooltipUI>
            </TooltipProvider>
          </Badge>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// RangeSelector Component
// ============================================================================

type RangeSelectorProps = {
  className?: string
}

function RangeSelector({ className }: RangeSelectorProps) {
  const { selectedRange, daysBetweenDates, isLoading, handleRangeChange } = useProductChartContext()

  if (isLoading) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {RANGES.map((range) => (
          <Skeleton key={range} variant="shimmer" className="h-8 w-10" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("animate-fade-in-fast flex flex-wrap items-center justify-start gap-2", className)}>
      {RANGES.map((range) => (
        <Button
          key={range}
          variant={range === selectedRange ? "default" : "ghost"}
          onClick={() => handleRangeChange(range)}
          disabled={range !== "Max" && daysBetweenDates < daysAmountInRange[range]}
          className="disabled:text-muted-foreground px-2 text-xs lg:text-sm"
        >
          {range}
        </Button>
      ))}
    </div>
  )
}

function formatPriceTickLabel(value: number): string {
  return `€${value.toFixed(2)}`
}

function estimatePriceAxisWidth(ticks: number[]): number {
  if (ticks.length === 0) return 40
  const longestLabel = ticks.reduce((longest, tick) => {
    const label = formatPriceTickLabel(tick)
    return label.length > longest.length ? label : longest
  }, "")
  return Math.max(40, longestLabel.length * 8 + 10)
}

function PriceYAxisTick({ x, y, payload }: { x: string | number; y: string | number; payload: { value: number } }) {
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      textAnchor="end"
      className="fill-foreground/70"
      key={`price-tick-${payload.value}`}
    >
      {formatPriceTickLabel(payload.value)}
    </text>
  )
}

function DiscountYAxisTick({ x, y, payload }: { x: string | number; y: string | number; payload: { value: number } }) {
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dx={4}
      textAnchor="start"
      className="fill-foreground/70"
      key={`discount-tick-${payload.value}`}
    >
      {formatPercentFixed(payload.value, 0)}
    </text>
  )
}

// ============================================================================
// Graph Component
// ============================================================================

type GraphProps = {
  className?: string
}

function Graph({ className }: GraphProps) {
  const {
    chartData,
    chartBounds,
    activeAxis,
    isLoading,
    isTransitioning,
    showDots,
    baseDotRadius,
    isMobile,
    chartRef,
    isTooltipActive,
    daysBetweenDates,
  } = useProductChartContext()

  const chartSpanDays = useMemo(() => {
    if (chartData.length < 2) return Math.max(1, daysBetweenDates || 30)
    const ts = chartData.map((d) => d.timeMs)
    return Math.max(1, Math.ceil((Math.max(...ts) - Math.min(...ts)) / 86400000))
  }, [chartData, daysBetweenDates])

  const xTimeDomain = useMemo((): [number, number] | null => {
    if (chartData.length === 0) return null
    const ts = chartData.map((d) => d.timeMs)
    let min = Math.min(...ts)
    let max = Math.max(...ts)
    if (min === max) {
      min -= 86400000
      max += 86400000
    }
    const span = max - min
    const pad = Math.max(span * 0.02, 86400000 * 0.5)
    return [min - pad, max + pad]
  }, [chartData])

  if (isLoading) {
    return (
      <div className={cn("mb-2 flex w-full items-center justify-center", className)}>
        <Skeleton variant="shimmer" className="aspect-video w-full rounded-lg" />
      </div>
    )
  }

  function getLineChartConfig(axis: string, chartDataLength: number) {
    const isSinglePoint = chartDataLength === 1
    const dotRadius = showDots || isSinglePoint ? baseDotRadius : 0
    const color = chartConfig[axis as keyof typeof chartConfig]?.color ?? "var(--chart-1)"

    const dotConfig = { r: dotRadius, fill: color, strokeWidth: 0 }
    const activeDotConfig = {
      r: dotRadius >= 2 ? dotRadius + 1 : FALLBACK_ACTIVE_DOT_RADIUS,
      fill: color,
      strokeWidth: 0,
    }

    switch (axis) {
      case "price-recommended":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "8 8",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 1.5 : 2,
        }
      case "price-per-major-unit":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "4 4",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 1.5 : 2,
        }
      case "discount":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "5 5",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: 1.5,
        }
      case "price":
      default:
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "0 0",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 1.5 : 2.25,
        }
    }
  }

  if (activeAxis.length === 0) {
    return <NoAxisSelected />
  }

  return (
    <div ref={chartRef} className={cn("touch-pan-y", className)}>
      <ChartContainer
        config={chartConfig}
        className="animate-fade-in"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: `opacity ${CHART_TRANSITION_DURATION}ms ease-in-out`,
        }}
      >
        <LineChart accessibilityLayer data={chartData} margin={{ left: 4, right: 14, top: 12, bottom: 36 }}>
          <CartesianGrid strokeDasharray="4 4" syncWithTicks yAxisId="price" />
          <XAxis
            type="number"
            dataKey="timeMs"
            domain={xTimeDomain ?? [0, 1]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveEnd"
            minTickGap={isMobile ? 28 : 16}
            tickFormatter={(v) => formatChartAxisTick(Number(v), chartSpanDays)}
          />
          <YAxis
            yAxisId="price"
            orientation="left"
            tickLine={false}
            axisLine={false}
            width={estimatePriceAxisWidth(chartBounds.ticks)}
            type="number"
            domain={[chartBounds.floor, chartBounds.ceiling]}
            ticks={chartBounds.ticks}
            allowDataOverflow={false}
            tick={PriceYAxisTick}
          />
          <YAxis
            dataKey="discount"
            yAxisId="discount"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 44 : 52}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => formatPercentFixed(Number(value), 0)}
            tick={DiscountYAxisTick}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const rawDate = (payload[0] as { payload?: { rawDate?: string } })?.payload?.rawDate
                  if (!rawDate) return ""
                  return new Date(rawDate).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                }}
              />
            }
            {...(isMobile ? { active: isTooltipActive } : {})}
          />
          {chartData.length > 0 &&
            Object.entries(chartConfig)
              .filter(([key]) => activeAxis.includes(key))
              .map(([key, config]) => {
                const { dot, strokeDasharray, strokeWidth, activeDot } = getLineChartConfig(key, chartData.length)
                return (
                  <Line
                    key={key}
                    yAxisId={key.includes("price") ? "price" : "discount"}
                    dataKey={key}
                    type="stepAfter"
                    stroke={config.color}
                    strokeOpacity={1}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    dot={dot}
                    activeDot={activeDot}
                    isAnimationActive={false}
                    connectNulls
                  />
                )
              })}
        </LineChart>
      </ChartContainer>
    </div>
  )
}

// ============================================================================
// PriceTable Component
// ============================================================================

type PvprGroup = {
  pvpr: number | null
  points: PricePoint[]
}

function isUnknownPvpr(p: PricePoint) {
  return p.price_recommended == null || Number.isNaN(p.price_recommended)
}

function orderPointsInGroup(points: PricePoint[], sp: StoreProduct): PricePoint[] {
  const sorted = [...points].sort(
    (a, b) => a.price - b.price || (a.price_recommended ?? 0) - (b.price_recommended ?? 0),
  )
  const current = sorted.find((p) => p.price === sp.price && p.price_recommended === sp.price_recommended)
  const rest = sorted.filter((p) => !(p.price === sp.price && p.price_recommended === sp.price_recommended))
  return current ? [current, ...rest] : sorted
}

function groupPricePointsByPvprDesc(pricePoints: PricePoint[], sp: StoreProduct): PvprGroup[] {
  const keyToPoints = new Map<string, PricePoint[]>()
  for (const p of pricePoints) {
    const key = isUnknownPvpr(p) ? "__unknown__" : String(p.price_recommended)
    if (!keyToPoints.has(key)) keyToPoints.set(key, [])
    keyToPoints.get(key)!.push(p)
  }

  const groups: PvprGroup[] = []
  for (const [key, points] of keyToPoints) {
    const pvpr = key === "__unknown__" ? null : Number(key)
    groups.push({ pvpr, points: orderPointsInGroup(points, sp) })
  }

  groups.sort((a, b) => {
    if (a.pvpr == null && b.pvpr == null) return 0
    if (a.pvpr == null) return 1
    if (b.pvpr == null) return -1
    return b.pvpr - a.pvpr
  })

  return groups
}

type PriceTableProps = {
  className?: string
  scrollable?: boolean
}

function PriceTable({ className, scrollable = true }: PriceTableProps) {
  const { sp, pricePoints, mostCommon, trackingSince, isLoading } = useProductChartContext()
  const t = useTranslations("products.chart.table")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  if (isLoading) {
    return (
      <div className={cn("flex w-full max-w-full min-w-0 flex-1 shrink-0 flex-col gap-2 overflow-hidden", className)}>
        <Skeleton variant="shimmer" className="h-10 w-full rounded-lg" />
        <div className="mt-1 flex flex-col rounded-lg border">
          <Skeleton variant="shimmer" className="h-7 w-full rounded-none rounded-t-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="shimmer" className="-mt-px h-8 w-full rounded-none last:rounded-b-lg" />
          ))}
        </div>
        <Skeleton variant="shimmer" className="h-3 w-52" />
      </div>
    )
  }

  if (!pricePoints || pricePoints.length === 0) return null

  const hasMultiplePrices = pricePoints.length > 1
  const groups = groupPricePointsByPvprDesc(pricePoints, sp)
  const showPvprSubheaders = groups.length > 1

  const pricePointRowKey = (point: PricePoint) =>
    `${point.price}-${point.price_recommended ?? "x"}-${point.price_per_major_unit ?? "x"}`

  const pricePointsTable = (
    <Table className="w-full max-w-full min-w-0">
      <TableHeader className={cn(scrollable && "sticky top-0 z-10")}>
        <TableRow className="bg-accent hover:bg-accent">
          <TableHead
            className={cn("text-foreground h-7 px-2.5 py-1.5 text-xs font-semibold tracking-tight first:pl-2.5")}
          >
            {t("price")}
          </TableHead>
          <TableHead
            className={cn(
              "text-foreground border-border h-7 border-l px-2.5 py-1.5 text-center text-xs font-semibold tracking-tight",
            )}
            title={t("pvprColumnHint")}
          >
            {t("original")}
          </TableHead>
          <TableHead
            className={cn(
              "text-foreground border-border h-7 border-l px-2.5 py-1.5 text-center text-xs font-semibold tracking-tight",
            )}
          >
            {t("perUnit")}
          </TableHead>
          <TableHead
            className={cn(
              "text-foreground border-border h-7 border-l px-2.5 py-1.5 text-center text-xs font-semibold tracking-tight",
            )}
          >
            {t("freq")}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {groups.map((group, gIdx) => {
          const ordered = group.points
          return (
            <Fragment key={group.pvpr == null ? "unknown" : `pvpr-${group.pvpr}`}>
              {showPvprSubheaders && (
                <TableRow className="hover:bg-muted/30 bg-muted/20 border-b-border border-b">
                  <TableCell colSpan={4} className="text-foreground/80 text-2xs py-1.5 font-medium tracking-tight">
                    {group.pvpr == null ? t("unknownPvpr") : t("groupPvpr", { value: group.pvpr.toFixed(2) })}
                  </TableCell>
                </TableRow>
              )}

              {ordered.map((point: PricePoint, pointIdx) => {
                const isMostCommon = point.price === mostCommon?.price
                const isCurrentPrice = sp.price === point.price && sp.price_recommended === point.price_recommended
                const hasDiscount = point.discount !== null && point.discount > 0.0
                const hasRowBelow = pointIdx < ordered.length - 1 || gIdx < groups.length - 1
                const showCurrentDivider =
                  isCurrentPrice && pointIdx === 0 && hasRowBelow && (hasMultiplePrices || showPvprSubheaders)

                return (
                  <TableRow
                    key={pricePointRowKey(point)}
                    className={cn(
                      "hover:bg-transparent",
                      isCurrentPrice &&
                        hasMultiplePrices &&
                        "border-l-primary bg-primary/10 dark:bg-primary/15 border-l-2",
                      showCurrentDivider && "border-b-border border-b",
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isCurrentPrice && hasMultiplePrices && (
                          <span className="text-primary text-xs leading-none">{CURRENT_ROW_MARKER}</span>
                        )}

                        <span className="text-xs font-semibold tracking-tighter">
                          {t("cellEuro", { value: point.price.toFixed(2) })}
                        </span>

                        {hasDiscount && (
                          <span className="text-2xs text-success flex items-center gap-0.5">
                            <ArrowDownIcon className="size-2.5" />
                            {discountValueToPercentage(point.discount, 0)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center text-xs font-medium tracking-tighter">
                      {point.price_recommended != null && !Number.isNaN(point.price_recommended)
                        ? t("cellEuro", { value: point.price_recommended.toFixed(2) })
                        : t("emptyCell")}
                    </TableCell>

                    <TableCell className="text-center text-xs font-medium tracking-tighter">
                      {point.price_per_major_unit != null && !Number.isNaN(point.price_per_major_unit)
                        ? t("cellEuro", { value: point.price_per_major_unit.toFixed(2) })
                        : t("emptyCell")}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-center text-xs font-medium tracking-tighter",
                        isMostCommon ? "text-success font-semibold" : "",
                      )}
                    >
                      {formatPercentFixed(point.frequencyRatio * 100, 0)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )

  return (
    <div
      className={cn(
        "animate-fade-in-fast flex w-full max-w-full min-w-0 flex-1 shrink-0 flex-col gap-2 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-start gap-2 rounded-lg border px-2.5 py-1.5 pr-3 text-sm",
          sp.price === mostCommon?.price
            ? "bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/40"
            : "bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/40",
        )}
      >
        {sp.price === mostCommon?.price ? (
          <span className="min-w-0 wrap-break-word">
            {t.rich("isMostCommon", {
              strong: (chunks) => <span className="text-success font-bold">{chunks}</span>,
            })}
          </span>
        ) : (
          <span className="min-w-0 wrap-break-word">
            {t.rich("notMostCommon", {
              strong: (chunks) => <span className="text-destructive font-bold">{chunks}</span>,
            })}
          </span>
        )}
      </div>

      {scrollable ? (
        <ScrollArea className={cn("mt-1 max-w-full min-w-0 rounded-lg border")}>{pricePointsTable}</ScrollArea>
      ) : (
        <div className="mt-1 max-w-full min-w-0 overflow-x-auto rounded-lg border">{pricePointsTable}</div>
      )}

      {trackingSince && (
        <blockquote className="text-muted-foreground text-2xs text-left wrap-break-word md:text-right">
          {t("showingFor", { duration: formatRelativeTime(new Date(trackingSince), "long", locale) })}
        </blockquote>
      )}
    </div>
  )
}

// ============================================================================
// NotTracked Component
// ============================================================================

type NotTrackedDisplayProps = {
  className?: string
}

const emptyStateContainerClasses = "bg-muted/50 flex w-full max-w-xl flex-col gap-2 rounded-lg border p-4"

function NotTrackedDisplay({ className }: NotTrackedDisplayProps) {
  const { sp } = useProductChartContext()
  const t = useTranslations("products.chart.notTracked")

  if (sp.priority !== null && sp.priority > 0) return null

  return (
    <div className={cn(emptyStateContainerClasses, className)}>
      <Badge className="w-fit" variant="secondary">
        <InfoIcon className="h-4 w-4" />
        {t("badge")}
      </Badge>
      <p className="text-sm">
        {t.rich("body", {
          ago: formatDistanceToNow(sp.updated_at),
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
    </div>
  )
}

// ============================================================================
// NoData Component
// ============================================================================

type NoDataDisplayProps = {
  className?: string
}

function NoDataDisplay({ className }: NoDataDisplayProps) {
  const { isLoading, error, chartData } = useProductChartContext()
  const t = useTranslations("products.chart.noData")

  if (isLoading || error || chartData.length > 0) return null

  return (
    <div className={cn(emptyStateContainerClasses, className)}>
      <Badge className="w-fit" variant="secondary">
        <BarChart2Icon className="h-4 w-4" />
        {t("badge")}
      </Badge>
      <p className="text-sm">{t("body")}</p>
    </div>
  )
}

// ============================================================================
// Error Component
// ============================================================================

type ErrorDisplayProps = {
  className?: string
}

function ErrorDisplay({ className }: ErrorDisplayProps) {
  const { error } = useProductChartContext()
  const t = useTranslations("products.chart.errorState")

  if (!error) return null

  return (
    <div className={cn("flex w-full flex-col items-center justify-center py-8", className)}>
      <p className="text-destructive">{t("title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t("body")}</p>
    </div>
  )
}

// ============================================================================
// Mobile analytics disclosure (expandable chart/table; summary lives above compare on mobile)
// ============================================================================

type AnalyticsDisclosureProps = {
  children: ReactNode
}

function AnalyticsDisclosure({ children }: AnalyticsDisclosureProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [open, setOpen] = useState(false)
  const t = useTranslations("products.chart")

  if (isDesktop) {
    return <div className="w-full min-w-0">{children}</div>
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible w-full min-w-0 space-y-3">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="text-foreground border-border bg-muted/25 hover:bg-muted/40 group-data-[state=open]/collapsible:bg-muted/50 flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left text-sm font-semibold"
        >
          <span className="flex items-center gap-1.5">
            <BinocularsIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 wrap-break-word">{t("priceHistoryBreakdown")}</span>
          </span>

          <ChevronDownIcon className="size-5 shrink-0 opacity-70 transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="min-w-0 overflow-hidden">{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ============================================================================
// ChartContent Component
// ============================================================================

type ChartContentProps = {
  children: ReactNode
}

function ChartContent({ children }: ChartContentProps) {
  const { isLoading, error, chartData } = useProductChartContext()

  if (error) return null
  if (!isLoading && chartData.length === 0) return null

  return <>{children}</>
}

// ============================================================================
// FallbackDetails Component
// ============================================================================

type FallbackDetailsProps = {
  className?: string
}

function FallbackDetails({ className }: FallbackDetailsProps) {
  const { sp, isLoading, error, chartData } = useProductChartContext()
  const isTracked = sp.priority != null && sp.priority > 0
  const showChart = isTracked && !isLoading && !error && chartData.length > 0
  if (showChart) return null

  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isNormalPrice =
    (!sp.price_recommended && sp.price) || (sp.price_recommended && sp.price && sp.price_recommended === sp.price)
  const isPriceNotSet = !sp.price_recommended && !sp.price

  if (isLoading) return null

  return (
    <div className={cn("flex w-full max-w-xl flex-col gap-2 rounded-lg", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {hasDiscount ? (
          <>
            <span className="text-success text-lg font-bold">{formatEuroCompact(sp.price!)}</span>
            <span className="text-muted-foreground text-sm line-through">
              {formatEuroCompact(sp.price_recommended!)}
            </span>
          </>
        ) : null}
        {isNormalPrice ? (
          <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{formatEuroCompact(sp.price)}</span>
        ) : null}
        {isPriceNotSet ? (
          <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{PRICE_PLACEHOLDER}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sp.price_per_major_unit && sp.major_unit ? (
          <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
            {formatEuroPerMajorUnit(sp.price_per_major_unit, sp.major_unit)}
          </Badge>
        ) : null}
        {sp.discount ? (
          <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
            {formatDiscountPercentWithMinus(sp.discount)}
          </Badge>
        ) : null}
        <PriceFreshnessInfo updatedAt={sp.updated_at} priority={sp.priority} />
      </div>
    </div>
  )
}

// ============================================================================
// Legacy ProductChart Component (Backward Compatible)
// ============================================================================

type LegacyProps = {
  sp: StoreProduct
  className?: string
  defaultRange?: DateRange
  onRangeChange?: (range: DateRange) => void
  samplingMode?: ChartSamplingMode
  options?: {
    showPricesVariationCard?: boolean
    showImage?: boolean
    showBarcode?: boolean
    showDots?: boolean
    dotRadius?: number
  }
}

const defaultOptions: NonNullable<LegacyProps["options"]> = {
  showPricesVariationCard: true,
  showImage: true,
  showBarcode: true,
  showDots: undefined,
  dotRadius: undefined,
}

function ProductChartLegacy({
  sp,
  className,
  defaultRange = "1M",
  onRangeChange,
  samplingMode = "hybrid",
  options = defaultOptions,
}: LegacyProps) {
  const showPricesVariation = options?.showPricesVariationCard ?? true
  const showImage = options?.showImage ?? true
  const showBarcode = options?.showBarcode ?? true

  return (
    <Root
      sp={sp}
      defaultRange={defaultRange}
      onRangeChange={onRangeChange}
      samplingMode={samplingMode}
      className={className}
    >
      <ErrorDisplay />

      {showPricesVariation && <PricesVariation showImage={showImage} showBarcode={showBarcode} />}

      <RangeSelector className="mt-2 mb-2 md:mt-0 md:mb-4" />

      <Graph />

      <PriceTable />
    </Root>
  )
}

// ============================================================================
// Compound Component Export
// ============================================================================

export const ProductChart = Object.assign(ProductChartLegacy, {
  Root,
  PricesVariation,
  RangeSelector,
  Graph,
  PriceTable,
  ChartContent,
  AnalyticsDisclosure,
  FallbackDetails,
  NotTracked: NotTrackedDisplay,
  NoData: NoDataDisplay,
  Error: ErrorDisplay,
})

// Also export types for external use
export type {
  RootProps,
  PricesVariationProps,
  RangeSelectorProps,
  GraphProps,
  PriceTableProps,
  ChartContentProps,
  FallbackDetailsProps,
  NotTrackedDisplayProps,
  NoDataDisplayProps,
}
