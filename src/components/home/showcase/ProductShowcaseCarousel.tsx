import Link from "next/link"
import Image from "next/image"
import { memo, useState, useEffect, useRef, useMemo, useCallback } from "react"
import { cn, buildChartData, chartConfig, generateProductPath } from "@/lib/utils"
import { useAllProductsWithPrices } from "@/hooks/useProducts"
import { productsWithPrices } from "@/lib/data/products"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import type { StoreProduct, Price } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/magic/border-beam"

import { ChevronLeft, ChevronRight, TrendingUp, ImageIcon, ScanBarcodeIcon } from "lucide-react"

const CAROUSEL_INTERVAL = 4000
const PRODUCT_IDS = [
  "18543", // buondi (continente)
  "4893", // m&ms (continente)
  "3519", // ben and jerry  (continente)
  "2558", // leite uht meio gordo mimosa (continente)
  "16258", // monster white (continente)
  "3807", // atum lata (continente)
  "18728", // cereais fitness (continente)
]

export function ProductShowcaseCarousel({ className }: { className?: string }) {
  const [api, setApi] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { data: allProductsData, isLoading } = useAllProductsWithPrices(PRODUCT_IDS)

  const displayData = useMemo(() => allProductsData || productsWithPrices, [allProductsData])

  const resetAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (api) intervalRef.current = setInterval(() => api.scrollNext(), CAROUSEL_INTERVAL)
  }, [api])

  useEffect(() => {
    if (!api) return

    const onSelect = () => setCurrent(api.selectedScrollSnap())

    api.on("select", onSelect)
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    resetAutoScroll()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [resetAutoScroll])

  const loadedProducts = useMemo(() => Object.keys(displayData), [displayData])

  const handlePrevClick = useCallback(() => {
    api?.scrollPrev()
    resetAutoScroll()
  }, [api, resetAutoScroll])

  const handleNextClick = useCallback(() => {
    api?.scrollNext()
    resetAutoScroll()
  }, [api, resetAutoScroll])

  const handleDotClick = useCallback(
    (index: number) => {
      api?.scrollTo(index)
      resetAutoScroll()
    },
    [api, resetAutoScroll],
  )

  if (loadedProducts.length === 0) {
    return (
      <div className={cn("relative rounded-lg border", className)}>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Unable to load product data</p>
        </div>
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
        <CarouselContent className="ml-0 border-0 shadow-none">
          {PRODUCT_IDS.map((productId, index) => (
            <CarouselItem key={productId} className="border-0 pl-0 shadow-none">
              <HandpickedShowcaseChart
                storeProductId={productId}
                className="border-0 shadow-none"
                productData={displayData[productId as keyof typeof displayData]}
              />
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
          {PRODUCT_IDS.map((_, index) => (
            <CarouselDot key={index} active={current === index} ringOffset={2} onClick={() => handleDotClick(index)} />
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={handleNextClick} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const HandpickedShowcaseChart = memo(function HandpickedShowcaseChart({
  storeProductId,
  className,
  productData,
}: {
  storeProductId: string
  className?: string
  productData?: { storeProduct: StoreProduct; prices: Price[] }
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
  }, [storeProductId])

  const priceStats = useMemo(() => {
    if (!productData?.prices || productData.prices.length < 2) return null

    const sortedPrices = [...productData.prices].sort(
      (a, b) => new Date(a.valid_from || "").getTime() - new Date(b.valid_from || "").getTime(),
    )

    const firstPrice = sortedPrices[0].price || 0
    const lastPrice = sortedPrices[sortedPrices.length - 1].price || 0
    const priceChange = lastPrice - firstPrice
    const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0

    const avgPrice = productData.prices.reduce((sum, p) => sum + (p.price || 0), 0) / productData.prices.length
    const maxPrice = Math.max(...productData.prices.map((p) => p.price || 0))
    const minPrice = Math.min(...productData.prices.map((p) => p.price || 0))

    const allPriceValues = productData.prices
      .flatMap((p) => [p.price || 0, p.price_recommended || 0, p.price_per_major_unit || 0])
      .filter((value) => value > 0)

    const outstandingMinPriceValue = allPriceValues.length > 0 ? Math.min(...allPriceValues) : 0
    const outstandingMaxPriceValue = allPriceValues.length > 0 ? Math.max(...allPriceValues) : 0

    return {
      priceChange,
      priceChangePercent,
      avgPrice,
      maxPrice,
      minPrice,
      outstandingMinPriceValue,
      outstandingMaxPriceValue,
      isIncrease: priceChange > 0,
      isDecrease: priceChange < 0,
      isStable: priceChange === 0,
    }
  }, [productData?.prices])

  const chartData = useMemo(() => {
    if (!productData?.prices) return []
    return buildChartData(productData.prices, "1M")
  }, [productData?.prices])

  if (!productData) {
    return (
      <Card className={cn("relative", className)}>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading product data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { storeProduct, prices } = productData

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
        <ChartContainer config={chartConfig}>
          <LineChart
            data={chartData}
            accessibilityLayer
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
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
              domain={[0, priceStats?.outstandingMaxPriceValue ? priceStats.outstandingMaxPriceValue * 1.05 : 15]}
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
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
      </CardContent>

      {priceStats && (
        <CardFooter className="pt-0">
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                {priceStats.isIncrease ? (
                  <>
                    Trending up by {priceStats.priceChangePercent.toFixed(1)}% this month{" "}
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </>
                ) : priceStats.isDecrease ? (
                  <>
                    Trending down by {Math.abs(priceStats.priceChangePercent).toFixed(1)}% this month{" "}
                    <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
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
      )}
    </Card>
  )
})

interface CarouselDotProps {
  active: boolean
  ringOffset?: number // Distance from dot edge to ring (in pixels)
  onClick: () => void
}

const CarouselDot = memo(function CarouselDot({ active, ringOffset = 2, onClick }: CarouselDotProps) {
  // Use precise pixel values to avoid sub-pixel rendering issues
  const dotRadius = 5 // 10px diameter (size-2.5 = 10px)
  const strokeWidth = 2
  const ringRadius = dotRadius + ringOffset + 3 // Ensure adequate spacing

  // Ensure all calculations result in whole pixel values
  const svgSize = Math.ceil((ringRadius + strokeWidth / 2) * 2)
  const center = svgSize / 2

  // Use the ring radius directly for the circle, accounting for stroke width
  const circleRadius = ringRadius
  const circumference = circleRadius * 2 * Math.PI

  return (
    <button
      className="relative flex items-center justify-center"
      onClick={onClick}
      style={{ width: svgSize, height: svgSize }}
    >
      {/* Background dot */}
      <div
        className={cn(
          "size-2.5 rounded-full transition-all duration-200",
          active ? "bg-foreground" : "bg-muted-foreground/30",
        )}
      />

      {/* Ring around active dot */}
      {active && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{
            // Optimize rendering for crisp circles
            shapeRendering: "geometricPrecision",
          }}
        >
          {/* Actual ring with CSS animation */}
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
            className="text-foreground opacity-80"
            style={{
              animation: `carousel-progress ${CAROUSEL_INTERVAL}ms linear infinite`,
              // Ensure pixel-perfect rendering
              vectorEffect: "non-scaling-stroke",
            }}
          />
        </svg>
      )}

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes carousel-progress {
          from {
            stroke-dashoffset: ${circumference};
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </button>
  )
})
