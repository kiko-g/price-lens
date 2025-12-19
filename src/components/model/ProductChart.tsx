"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { StoreProduct, ProductChartEntry, PricePoint } from "@/types"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { RANGES, DateRange, daysAmountInRange } from "@/types/extra"
import { cn, buildChartData, imagePlaceholder, chartConfig } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useActiveAxis } from "@/hooks/useActiveAxis"
import { usePricesWithAnalytics } from "@/hooks/usePrices"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PricesVariationCard } from "@/components/model/PricesVariationCard"

import { BinocularsIcon, ImageIcon, Loader2Icon, ScanBarcodeIcon } from "lucide-react"

type Props = {
  sp: StoreProduct
  className?: string
  options?: {
    showPricesVariationCard: boolean
    showImage: boolean
  }
}

const defaultOptions: Props["options"] = {
  showPricesVariationCard: true,
  showImage: true,
}

export function ProductChart({ sp, className, options = defaultOptions }: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange>("1M")
  const [activeAxis, updateActiveAxis] = useActiveAxis()

  const id = sp.id?.toString() || ""
  const { data, isLoading, error } = usePricesWithAnalytics(id, { enabled: true })

  const prices = data?.prices || []
  const analytics = data?.analytics || null

  // Get computed analytics from backend
  const pricePoints = analytics?.pricePoints || null
  const mostCommon = analytics?.mostCommon || null

  // Get computed floor/ceiling from backend (filtered by activeAxis on client for chart display)
  const { floor, ceiling } = useMemo(() => {
    if (!analytics) return { floor: 0, ceiling: 0 }

    const allPrices = prices
      .flatMap((p) => [
        activeAxis.includes("price") ? (p.price ?? -Infinity) : -Infinity,
        activeAxis.includes("price-recommended") ? (p.price_recommended ?? -Infinity) : -Infinity,
        activeAxis.includes("price-per-major-unit") ? (p.price_per_major_unit ?? -Infinity) : -Infinity,
      ])
      .filter((price) => price !== -Infinity && price !== null)

    if (allPrices.length === 0) return { floor: analytics.floor, ceiling: analytics.ceiling }

    return {
      floor: Math.floor(Math.min(...allPrices)),
      ceiling: Math.ceil(Math.max(...allPrices)),
    }
  }, [prices, activeAxis, analytics])

  const priceVariation = analytics?.variations.price || 0
  const priceRecommendedVariation = analytics?.variations.priceRecommended || 0
  const pricePerMajorUnitVariation = analytics?.variations.pricePerMajorUnit || 0
  const discountVariation = analytics?.variations.discount || 0

  const daysBetweenDates = analytics?.dateRange.daysBetween || 0

  useEffect(() => {
    if (!prices || prices.length === 0) return

    const pricePoints = buildChartData(prices, selectedRange)
    setChartData(pricePoints)
  }, [selectedRange, prices])

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

    switch (axis) {
      case "price-recommended":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "8 8",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: isMobile ? 2 : 3,
        }
      case "price-per-major-unit":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "4 4",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: isMobile ? 2 : 3,
        }
      case "discount":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "5 5",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: isMobile ? 2 : 2,
        }
      case "price":
      default:
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "0 0",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
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

          <div className="flex flex-1 flex-col items-end justify-center gap-2">
            {options?.showImage &&
              (sp.image ? (
                <div className="relative">
                  <Link href={`/supermarket/${sp.id}`} target="_blank">
                    <Image
                      src={resolveImageUrlForDrawer(sp.image, 400)}
                      alt={sp.name}
                      width={400}
                      height={400}
                      className="aspect-square size-24 rounded-md border bg-white object-contain p-1 md:size-32"
                      placeholder="empty"
                      blurDataURL={imagePlaceholder.productBlur}
                      loading="lazy"
                    />
                    <Badge className="absolute right-1 bottom-1" size="sm" variant="boring">
                      <ScanBarcodeIcon />
                    </Badge>
                  </Link>
                </div>
              ) : (
                <div className="bg-muted flex aspect-square w-24 items-center justify-center rounded-md">
                  <ImageIcon className="h-4 w-4" />
                </div>
              ))}
          </div>
        </header>
      )}

      <div className="mt-2 mb-2 flex flex-wrap items-center justify-start gap-2 md:mt-2 md:mb-4">
        {RANGES.map((range) => (
          <Button
            key={range}
            variant={range === selectedRange ? "default" : "ghost"}
            onClick={() => setSelectedRange(range)}
            disabled={range !== "Max" && daysBetweenDates < daysAmountInRange[range]}
            className="disabled:text-muted-foreground px-2 text-xs lg:text-sm"
          >
            {range}
          </Button>
        ))}
        {isLoading && <Loader2Icon className="ml-4 h-5 w-5 animate-spin" />}
      </div>

      <div className="max-w-[32rem] md:max-w-full">
        <ChartContainer config={chartConfig} className={cn(isLoading ? "" : "animate-fade-in")}>
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
              tickMargin={10}
              interval="preserveEnd"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            <YAxis
              dataKey="price"
              yAxisId="price"
              orientation="left"
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[floor * 0.75, ceiling * 1.05]}
              ticks={Array.from({ length: 5 }, (_, i) => floor / 2 + ((ceiling - floor / 2) * i) / 4).map(
                (tick, index) => tick + index * 0.0001,
              )}
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {chartData.length > 0 &&
              Object.entries(chartConfig)
                .filter(([key]) => activeAxis.includes(key))
                .map(([key, config], index) => {
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
                      {point.price_recommended.toFixed(2)}€
                    </TableCell>

                    <TableCell className="text-muted-foreground text-center font-mono text-xs font-medium tracking-tighter">
                      {point.price_per_major_unit.toFixed(2)}€
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
