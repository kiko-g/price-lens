"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useActiveAxis } from "@/hooks/useActiveAxis"
import { usePricesWithAnalytics } from "@/hooks/usePrices"

import type { StoreProduct, ProductChartEntry, PricePoint } from "@/types"
import { RANGES, DateRange, daysAmountInRange } from "@/types/business"

import { cn } from "@/lib/utils"
import { buildChartData, chartConfig, calculateChartBounds, type ChartSamplingMode } from "@/lib/business/chart"
import { generateProductPath } from "@/lib/business/product"
import { imagePlaceholder } from "@/lib/business/data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Barcode } from "@/components/ui/combo/barcode"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PricesVariationCard } from "@/components/products/PricesVariationCard"

import { BinocularsIcon, ImageIcon, Loader2Icon, WifiOffIcon } from "lucide-react"

const FALLBACK_ACTIVE_DOT_RADIUS = 5
const CHART_TRANSITION_DURATION = 300 // ms for fade transition

/**
 * Custom hook to handle chart touch interactions for mobile.
 * Provides touch-to-reveal tooltip behavior that dismisses on release (like Trade Republic).
 */
function useChartTouch() {
  const [isActive, setIsActive] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = chartRef.current
    if (!element) return

    const handleTouchStart = () => {
      setIsActive(true)
    }

    const handleTouchEnd = () => {
      // Small delay to allow the last tooltip position to render before hiding
      setTimeout(() => setIsActive(false), 50)
    }

    const handleMouseLeave = () => {
      setIsActive(false)
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true })
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
      element.removeEventListener("touchcancel", handleTouchEnd)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return { chartRef, isActive }
}

type Props = {
  sp: StoreProduct
  className?: string
  defaultRange?: DateRange
  onRangeChange?: (range: DateRange) => void
  /** Chart data sampling mode: 'raw' (1 point/day), 'hybrid' (boundaries + samples), 'efficient' (boundaries only) */
  samplingMode?: ChartSamplingMode
  options?: {
    showPricesVariationCard?: boolean
    showImage?: boolean
    showBarcode?: boolean
    showDots?: boolean
    dotRadius?: number
  }
}

const defaultOptions: NonNullable<Props["options"]> = {
  showPricesVariationCard: true,
  showImage: true,
  showBarcode: true,
  showDots: undefined, // Will be determined by samplingMode
  dotRadius: undefined, // Will be determined by samplingMode
}

export function ProductChart({
  sp,
  className,
  defaultRange = "1W",
  onRangeChange,
  samplingMode = "hybrid",
  options = defaultOptions,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const showDots = options?.showDots ?? samplingMode === "efficient"
  const baseDotRadius = options?.dotRadius ?? (isMobile ? 2 : 0)

  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange>(defaultRange)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeAxis, updateActiveAxis] = useActiveAxis()
  const pendingRangeRef = useRef<DateRange | null>(null)
  const { chartRef, isActive: isTooltipActive } = useChartTouch()
  const id = sp.id?.toString() || ""
  const { data, isLoading, error } = usePricesWithAnalytics(id, { enabled: true })

  const prices = useMemo(() => data?.prices || [], [data?.prices])
  const analytics = data?.analytics || null

  // Get computed analytics from backend
  const pricePoints = analytics?.pricePoints || null
  const mostCommon = analytics?.mostCommon || null

  // Calculate chart bounds from VISIBLE chartData (respects selected time range)
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
    return calculateChartBounds(min, max)
  }, [chartData, activeAxis])

  const priceVariation = analytics?.variations.price || 0
  const priceRecommendedVariation = analytics?.variations.priceRecommended || 0
  const pricePerMajorUnitVariation = analytics?.variations.pricePerMajorUnit || 0
  const discountVariation = analytics?.variations.discount || 0

  const daysBetweenDates = analytics?.dateRange.daysBetween || 0

  // Calculate X-axis tick interval to show ~8 ticks max
  const xAxisTickInterval = useMemo(() => {
    const dataLength = chartData.length
    if (dataLength <= 8) return 0 // Show all ticks
    return Math.floor(dataLength / 8)
  }, [chartData.length])

  // Build chart data with smooth transition
  const updateChartData = useCallback(
    (range: DateRange) => {
      if (!prices || prices.length === 0) return
      const pricePoints = buildChartData(prices, { range, samplingMode })
      setChartData(pricePoints)
    },
    [prices, samplingMode],
  )

  // Initial data load (no transition)
  useEffect(() => {
    if (!prices || prices.length === 0) return
    updateChartData(selectedRange)
  }, [prices]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle range change with crossfade transition
  useEffect(() => {
    const pendingRange = pendingRangeRef.current
    if (!pendingRange || !prices || prices.length === 0) return

    // Start fade-out
    setIsTransitioning(true)

    const fadeOutTimer = setTimeout(() => {
      // Update data while faded out
      updateChartData(pendingRange)

      // Start fade-in
      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false)
        pendingRangeRef.current = null
      }, 50)

      return () => clearTimeout(fadeInTimer)
    }, CHART_TRANSITION_DURATION)

    return () => clearTimeout(fadeOutTimer)
  }, [selectedRange, prices, updateChartData])

  // Early return for error state - all hooks must be called before this
  if (error) {
    return (
      <div className={cn("flex w-full flex-col items-center justify-center py-8", className)}>
        <p className="text-destructive">Failed to load price data</p>
        <p className="text-muted-foreground mt-1 text-sm">Please try refreshing the page</p>
      </div>
    )
  }

  function getLineChartConfig(axis: string, chartDataLength: number) {
    const isSinglePoint = chartDataLength === 1
    const dotRadius = showDots || isSinglePoint ? baseDotRadius : 0

    // Get the color for this axis from chartConfig
    const color = chartConfig[axis as keyof typeof chartConfig]?.color ?? "var(--chart-1)"

    // Solid filled dots that grow by 1 on hover
    const dotConfig = {
      r: dotRadius,
      fill: color,
      strokeWidth: 0,
    }

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
          strokeWidth: isMobile ? 2 : 3,
        }
      case "price-per-major-unit":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "4 4",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 2 : 3,
        }
      case "discount":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "5 5",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 2 : 2,
        }
      case "price":
      default:
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "0 0",
          dot: dotConfig,
          activeDot: activeDotConfig,
          strokeWidth: isMobile ? 2 : 4,
        }
    }
  }

  function resolveImageUrlForDrawer(image: string, size = 400) {
    const url = new URL(image)
    const p = url.searchParams
    const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
    fieldsToDelete.forEach((k) => p.delete(k))
    p.set("sw", String(size))
    p.set("sh", String(size))
    p.set("sm", "fit")
    return url.toString()
  }

  function handleAxisChange(axis: string) {
    const newAxis = activeAxis.includes(axis) ? activeAxis.filter((a) => a !== axis) : [...activeAxis, axis]
    updateActiveAxis(newAxis)
  }

  function handleRangeChange(range: DateRange) {
    if (range === selectedRange) return

    // Store the pending range and trigger the transition effect
    pendingRangeRef.current = range
    setSelectedRange(range)
    onRangeChange?.(range)
  }

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {(options?.showPricesVariationCard || options?.showImage) && (
        <header className="mb-2.5 flex items-start justify-between gap-3">
          {options?.showPricesVariationCard && (
            <PricesVariationCard
              state={{ activeAxis }}
              data={{
                discountVariation,
                priceVariation,
                priceRecommendedVariation,
                pricePerMajorUnitVariation,
                storeProduct: sp,
              }}
              options={{
                hideExtraInfo: !options?.showImage,
              }}
              actions={{
                onPriceChange: () => handleAxisChange("price"),
                onPriceRecommendedChange: () => handleAxisChange("price-recommended"),
                onPricePerMajorUnitChange: () => handleAxisChange("price-per-major-unit"),
                onDiscountChange: () => handleAxisChange("discount"),
              }}
              className="max-w-xs text-xs font-medium md:text-sm"
            />
          )}

          <div className="flex flex-1 flex-col items-end justify-center gap-3">
            {options?.showImage &&
              (sp.image ? (
                <div className="relative overflow-hidden">
                  <Link href={generateProductPath(sp)} target="_blank">
                    <Image
                      src={resolveImageUrlForDrawer(sp.image, 400)}
                      alt={sp.name}
                      width={400}
                      height={400}
                      className={cn(
                        "aspect-square size-24 rounded-md border bg-white object-contain p-1 transition-all duration-300 md:size-28",
                        sp.available ? "opacity-100 hover:scale-105" : "grayscale hover:scale-105",
                      )}
                      placeholder="empty"
                      blurDataURL={imagePlaceholder.productBlur}
                      loading="lazy"
                    />
                  </Link>

                  <div className="absolute top-1 left-1 flex flex-col gap-1">
                    {!sp.available && (
                      <Badge size="xs" variant="destructive">
                        <TooltipProvider>
                          <TooltipUI delayDuration={100}>
                            <TooltipTrigger>
                              <WifiOffIcon className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This product is not available in this store.</p>
                            </TooltipContent>
                          </TooltipUI>
                        </TooltipProvider>
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted flex aspect-square w-24 items-center justify-center rounded-md">
                  <ImageIcon className="h-4 w-4" />
                </div>
              ))}

            {options?.showBarcode && <Barcode value={sp.barcode} height={10} width={1} />}
          </div>
        </header>
      )}

      <div className="mt-2 mb-2 flex flex-wrap items-center justify-start gap-2 md:mt-0 md:mb-4">
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
        {isLoading && <Loader2Icon className="ml-4 h-5 w-5 animate-spin" />}
      </div>

      {/* Chart container with touch handling for mobile tooltip dismiss */}
      <div ref={chartRef} className="max-w-lg touch-pan-y md:max-w-full">
        <ChartContainer
          config={chartConfig}
          className={cn(isLoading ? "" : "animate-fade-in")}
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: `opacity ${CHART_TRANSITION_DURATION}ms ease-in-out`,
          }}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 4,
              right: -20,
              top: 12,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={xAxisTickInterval}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              dataKey="price"
              yAxisId="price"
              orientation="left"
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[chartBounds.floor, chartBounds.ceiling]}
              ticks={chartBounds.ticks}
              tickFormatter={(value) => `€${value.toFixed(0)}`}
              tick={(props) => <CustomTick {...props} yAxisId="price" />}
            />
            <YAxis
              dataKey="discount"
              yAxisId="discount"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={(props) => <CustomTick {...props} yAxisId="discount" />}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
              // On mobile, only show tooltip while finger is touching (Trade Republic style)
              // On desktop, use default hover behavior
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
                      type="linear"
                      stroke={config.color}
                      strokeOpacity={1}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      dot={dot}
                      activeDot={activeDot}
                      isAnimationActive={false}
                    />
                  )
                })}
          </LineChart>
        </ChartContainer>
      </div>

      {!isLoading && pricePoints !== null && pricePoints.length > 0 && (
        <div className="overflow-hidden">
          <div className="bg-accent flex items-center gap-2 rounded-lg border-0 px-2.5 py-1.5 pr-3 text-sm whitespace-nowrap">
            <BinocularsIcon className="h-4 w-4" />
            {sp.price === mostCommon?.price ? (
              <span>
                Current price is <span className="font-bold text-green-600">the most common price</span>
              </span>
            ) : (
              <span>
                Current price is <span className="text-destructive font-bold">not</span> the most common price
              </span>
            )}
          </div>

          <Table className="mt-1 rounded-lg">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 text-xs">
                  <span className="bg-chart-1 mr-1 inline-block size-2 rounded-full"></span>
                  Price
                </TableHead>
                <TableHead className="h-7 text-center text-xs">
                  <span className="bg-chart-2 mr-1 inline-block size-2 rounded-full"></span>
                  Original
                </TableHead>
                <TableHead className="h-7 text-center text-xs">
                  <span className="bg-chart-3 mr-1 inline-block size-2 rounded-full"></span>
                  Per Unit
                </TableHead>
                <TableHead className="h-7 text-center text-xs">
                  <span className="bg-chart-5 mr-1 inline-block size-2 rounded-full"></span>
                  Freq (%)
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pricePoints
                .sort((a, b) => b.price - a.price)
                .map((point: PricePoint, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold tracking-tighter">
                          {point.price.toFixed(2)}€
                        </span>

                        {point.discount !== null && point.discount > 0.0 && (
                          <Badge variant="destructive" size="xs" className="text-2xs font-mono tracking-tighter">
                            -{(point.discount * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {point.price === mostCommon?.price && (
                          <Badge variant="secondary" size="2xs">
                            Most Common
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-center font-mono text-xs font-medium tracking-tighter">
                      {point.price_recommended?.toFixed(2)}€
                    </TableCell>

                    <TableCell className="text-muted-foreground text-center font-mono text-xs font-medium tracking-tighter">
                      {point.price_per_major_unit?.toFixed(2)}€
                    </TableCell>

                    <TableCell className="text-muted-foreground text-center font-mono text-xs font-medium tracking-tighter">
                      {(point.frequencyRatio * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function CustomTick({ x, y, payload, yAxisId }: { x: number; y: number; payload: any; yAxisId: string }) {
  return (
    <text x={x} y={y} textAnchor="end" fill="#666" key={`${yAxisId}-tick-${payload.value}`}>
      {yAxisId === "price" ? `€${payload.value.toFixed(1)}` : `${payload.value}%`}
    </text>
  )
}
