"use client"

import Link from "next/link"
import Image from "next/image"
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useChartTouch } from "@/hooks/useChartTouch"
import { cn } from "@/lib/utils"
import { chartConfig, calculateChartBounds } from "@/lib/business/chart"
import { generateProductPath } from "@/lib/business/product"
import {
  SHOWCASE_PRODUCT_IDS,
  type ShowcaseData,
  type ShowcaseProduct,
  type ShowcaseTrendStats,
} from "@/lib/business/showcase"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/magic/border-beam"

import { ChevronLeft, ChevronRight, TrendingUp, ImageIcon, ScanBarcodeIcon } from "lucide-react"

const CAROUSEL_INTERVAL = 4000
const PAUSE_RESUME_DELAY = 3000

interface ProductShowcaseCarouselProps {
  className?: string
  initialData?: ShowcaseData
}

export function ProductShowcaseCarousel({ className, initialData }: ProductShowcaseCarouselProps) {
  const [api, setApi] = useState<any>(null)
  const [current, setCurrent] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle auto-scroll with pause support
  useEffect(() => {
    if (!api || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => api.scrollNext(), CAROUSEL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [api, isPaused])

  // Track current slide
  useEffect(() => {
    if (!api) return

    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [])

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true)
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
  }, [])

  const handleInteractionEnd = useCallback(() => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), PAUSE_RESUME_DELAY)
  }, [])

  const handlePrevClick = useCallback(() => {
    api?.scrollPrev()
    handleInteractionStart()
    handleInteractionEnd()
  }, [api, handleInteractionStart, handleInteractionEnd])

  const handleNextClick = useCallback(() => {
    api?.scrollNext()
    handleInteractionStart()
    handleInteractionEnd()
  }, [api, handleInteractionStart, handleInteractionEnd])

  const handleDotClick = useCallback(
    (index: number) => {
      api?.scrollTo(index)
      handleInteractionStart()
      handleInteractionEnd()
    },
    [api, handleInteractionStart, handleInteractionEnd],
  )

  const hasData = initialData && Object.keys(initialData).length > 0

  if (!hasData) {
    return (
      <div className={cn("relative rounded-lg border", className)}>
        <ShowcaseCardSkeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Carousel
        className={cn("relative overflow-hidden rounded-lg border", className)}
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent
          className="ml-0 border-0 shadow-none"
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
        >
          {SHOWCASE_PRODUCT_IDS.map((productId) => (
            <CarouselItem key={productId} className="border-0 pl-0 shadow-none">
              {initialData[productId] ? (
                <ShowcaseChart productData={initialData[productId]} className="border-0 shadow-none" />
              ) : (
                <ShowcaseCardSkeleton />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <BorderBeam
          duration={5}
          size={150}
          colorFrom="var(--color-primary-300)"
          colorTo="var(--color-primary-500)"
          borderWidth={3}
        />
      </Carousel>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={handlePrevClick} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 justify-center gap-2.5">
          {SHOWCASE_PRODUCT_IDS.map((_, index) => (
            <CarouselDot
              key={index}
              active={current === index}
              isPaused={isPaused}
              ringOffset={2}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={handleNextClick} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ShowcaseCardSkeleton() {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start justify-start gap-2">
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0 sm:p-4 sm:pt-2">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-40" />
        </div>
      </CardFooter>
    </Card>
  )
}

const ShowcaseChart = memo(function ShowcaseChart({
  productData,
  className,
}: {
  productData: ShowcaseProduct
  className?: string
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { chartRef, isActive: isTooltipActive } = useChartTouch()
  const { storeProduct, chartData, trendStats } = productData

  // Calculate chart bounds with nice numbers for Y-axis
  const chartBounds = useMemo(() => {
    if (chartData.length === 0) {
      return { floor: 0, ceiling: 1, tickInterval: 0.5, ticks: [0, 0.5, 1] }
    }

    const visiblePrices = chartData
      .flatMap((d) => [d.price, d["price-recommended"], d["price-per-major-unit"]])
      .filter((price) => price > 0)

    if (visiblePrices.length === 0) {
      return { floor: 0, ceiling: 1, tickInterval: 0.5, ticks: [0, 0.5, 1] }
    }

    const min = Math.min(...visiblePrices)
    const max = Math.max(...visiblePrices)
    return calculateChartBounds(min, max)
  }, [chartData])

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start justify-start gap-2">
          {storeProduct.image ? (
            <Link
              className="relative size-20 shrink-0 rounded-lg border p-1 transition-all duration-200 hover:opacity-80"
              href={generateProductPath(storeProduct)}
            >
              <Image
                src={storeProduct.image}
                alt={storeProduct.name || "Product"}
                className={cn(
                  "h-full w-full rounded-lg object-cover transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0",
                )}
                width={96}
                height={96}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
              {!imageLoaded && (
                <div className="bg-muted absolute inset-0 flex items-center justify-center rounded-lg">
                  <ImageIcon className="text-muted-foreground h-8 w-8" />
                </div>
              )}
            </Link>
          ) : (
            <div className="bg-muted flex size-24 items-center justify-center rounded-lg">
              <ImageIcon className="text-muted-foreground h-8 w-8" />
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg leading-5 font-semibold tracking-tighter">{storeProduct.name}</h2>
            <p className="text-muted-foreground text-sm">
              More details{" "}
              <Link href={generateProductPath(storeProduct)} className="hover:text-foreground underline">
                available here
                <ScanBarcodeIcon className="ml-1 inline-flex size-3" />
              </Link>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {storeProduct.brand && (
                <Badge variant="blue" size="xs" roundedness="sm">
                  {storeProduct.brand}
                </Badge>
              )}

              {storeProduct.pack && (
                <Badge
                  size="xs"
                  variant="boring"
                  roundedness="sm"
                  className="line-clamp-1 max-w-24 text-left tracking-tight"
                >
                  {storeProduct.pack}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 pt-0 sm:p-4 sm:pt-2">
        <div ref={chartRef} className="touch-pan-y">
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData} accessibilityLayer margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
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
                domain={[chartBounds.floor, chartBounds.ceiling]}
                ticks={chartBounds.ticks}
                tickFormatter={(value) => `€${value.toFixed(1)}`}
              />
              <YAxis
                dataKey="discount"
                yAxisId="discount"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={40}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
                {...(isMobile ? { active: isTooltipActive } : {})}
              />
              <Line yAxisId="price" dataKey="price" type="linear" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
              <Line
                yAxisId="price"
                dataKey="price-recommended"
                type="linear"
                stroke="var(--chart-2)"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={false}
              />
              <Line
                yAxisId="price"
                dataKey="price-per-major-unit"
                type="linear"
                stroke="var(--chart-3)"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
              />
              <Line
                yAxisId="discount"
                dataKey="discount"
                type="linear"
                stroke="var(--chart-4)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>

      <TrendFooter trendStats={trendStats} />
    </Card>
  )
})

function TrendFooter({ trendStats }: { trendStats: ShowcaseTrendStats }) {
  return (
    <CardFooter className="pt-0">
      <div className="flex w-full items-start gap-2 text-sm">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 leading-none font-medium">
            {trendStats.direction === "up" ? (
              <>
                Trending up by {trendStats.percent.toFixed(1)}% this month{" "}
                <TrendingUp className="h-4 w-4 text-red-500" />
              </>
            ) : trendStats.direction === "down" ? (
              <>
                Trending down by {trendStats.percent.toFixed(1)}% this month{" "}
                <TrendingUp className="h-4 w-4 rotate-180 text-green-500" />
              </>
            ) : (
              <>
                Price is relatively stable this month <TrendingUp className="h-4 w-4 text-blue-500" />
              </>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 leading-none">
            Showing price points for the last month
          </div>
        </div>
      </div>
    </CardFooter>
  )
}

interface CarouselDotProps {
  active: boolean
  isPaused: boolean
  ringOffset?: number
  onClick: () => void
}

const CarouselDot = memo(function CarouselDot({ active, isPaused, ringOffset = 2, onClick }: CarouselDotProps) {
  const dotRadius = 5
  const strokeWidth = 2
  const ringRadius = dotRadius + ringOffset + 3
  const svgSize = Math.ceil((ringRadius + strokeWidth / 2) * 2)
  const center = svgSize / 2
  const circleRadius = ringRadius
  const circumference = circleRadius * 2 * Math.PI

  return (
    <button
      className="relative flex items-center justify-center"
      onClick={onClick}
      style={{ width: svgSize, height: svgSize }}
    >
      <div
        className={cn(
          "size-2.5 rounded-full transition-all duration-200",
          active ? "bg-foreground" : "bg-muted-foreground/30",
        )}
      />

      {active && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ shapeRendering: "geometricPrecision" }}
        >
          <circle
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            fill="transparent"
            r={circleRadius}
            cx={center}
            cy={center}
            className="text-foreground carousel-progress-ring opacity-80"
            style={
              {
                "--circumference": circumference,
                "--duration": `${CAROUSEL_INTERVAL}ms`,
                animationPlayState: isPaused ? "paused" : "running",
                vectorEffect: "non-scaling-stroke",
              } as React.CSSProperties
            }
          />
        </svg>
      )}
    </button>
  )
})
