"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { cn, buildChartData } from "@/lib/utils"
import { useStoreProductWithPricesById, useAllProductsWithPrices } from "@/hooks/useProducts"
import { productsWithPrices } from "@/lib/data/products"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import type { StoreProduct, Price } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/magicui/border-beam"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { BadgeEuroIcon, ShoppingBasketIcon, TrendingUp, ImageIcon, ScanBarcodeIcon } from "lucide-react"
import { ceil, floor } from "lodash"
import { useMemo } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Hero() {
  return (
    <div className="z-20 flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-8 lg:flex-row lg:items-start lg:justify-start lg:gap-8 lg:px-20 lg:py-20">
      <div className="flex w-full flex-1 flex-col gap-4 pt-12 pb-4 md:gap-4 lg:pt-0 lg:pb-0">
        <h1 className="animate-fade-in z-10 -translate-y-4 bg-linear-to-br from-black from-30% to-black/40 bg-clip-text py-2 text-center text-4xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-left md:text-6xl lg:text-7xl dark:from-white dark:to-white/40">
          Price Lens
          <br className="block" />
          See through prices
        </h1>
        <p className="animate-fade-in text-muted-foreground max-w-3xl -translate-y-4 text-center tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
          Monitor daily price changes on essential consumer goods that impact inflation metrics. Stay informed and aware
          of how supermarket prices change. See beyond the headlines and tags. Data focused on Portugal-available
          supermarket chains.
        </p>

        <div className="animate-fade-in flex flex-wrap gap-3 opacity-0 [--animation-delay:600ms] md:mt-3 md:gap-4">
          <Button variant="primary" size="lg" className="w-full md:w-auto" asChild>
            <Link href="/supermarket">
              Explore Supermarket
              <ShoppingBasketIcon />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
            <Link href="/tracked">
              Tracked Products
              <BadgeEuroIcon />
            </Link>
          </Button>
        </div>

        <Brands className="mt-8" />
      </div>

      <div className="my-8 w-full max-w-full flex-1 self-start overflow-hidden lg:my-0 lg:w-auto lg:max-w-md">
        <ProductShowcaseCarousel className="border-border w-full bg-linear-to-br shadow-none" />
      </div>
    </div>
  )
}

function Brands({ className }: { className?: string }) {
  const brands = [
    {
      name: "Continente",
      component: ContinenteSvg,
      disabled: false,
    },
    {
      name: "Auchan",
      component: AuchanSvg,
      disabled: false,
    },
    {
      name: "Pingo Doce",
      component: PingoDoceSvg,
      disabled: false,
    },
  ]

  return (
    <div
      className={cn(
        "sm:max-w-m mx-auto mt-10 grid max-w-lg grid-cols-3 items-center justify-items-center gap-6 sm:gap-10 md:mx-0 lg:max-w-lg xl:max-w-xl",
        className,
      )}
    >
      {brands.map((brand) => (
        <div key={brand.name} className="flex w-full justify-center">
          <TooltipProvider>
            <Tooltip key={brand.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <brand.component
                  className={cn(
                    "h-auto w-24 sm:w-36 md:w-32 lg:w-32 xl:w-36",
                    brand.disabled && "opacity-50 grayscale",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{brand.disabled ? `${brand.name} will be supported soon` : `${brand.name} is supported`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  )
}

function HandpickedShowcaseChart({
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
  const chartData = buildChartData(prices, "1M")

  const chartConfig = {
    price: {
      label: "Price",
      color: "var(--chart-1)",
    },
    "price-recommended": {
      label: "Price without discount",
      color: "var(--chart-2)",
    },
    "price-per-major-unit": {
      label: "Price per major unit",
      color: "var(--chart-3)",
    },
    discount: {
      label: "Discount %",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start justify-start gap-2">
          {storeProduct.image ? (
            <div className="relative size-20 shrink-0">
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
            </div>
          ) : (
            <div className="bg-muted flex size-24 items-center justify-center rounded-lg">
              <ImageIcon className="text-muted-foreground h-8 w-8" />
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg leading-5 font-semibold tracking-tighter">{storeProduct.name}</h2>
            <p className="text-muted-foreground text-sm">
              More details{" "}
              <Link href={`/supermarket/${storeProductId}`} className="hover:text-foreground underline">
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
}

function ProductShowcaseCarousel({ className }: { className?: string }) {
  const interval = 8000
  const productIds = ["2558", "16258", "3807", "18728"]
  const [api, setApi] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { data: allProductsData, isLoading } = useAllProductsWithPrices(productIds)

  const displayData = allProductsData || productsWithPrices

  const resetAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (api) {
      intervalRef.current = setInterval(() => api.scrollNext(), interval)
    }
  }, [api, interval])

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    resetAutoScroll()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [resetAutoScroll])

  const loadedProducts = Object.keys(displayData)
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
        <CarouselContent className="-ml-0 border-0 shadow-none">
          {productIds.map((productId, index) => (
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
          colorFrom="var(--color-primary)"
          colorTo="var(--color-secondary)"
          borderWidth={3}
        />
      </Carousel>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            api?.scrollPrev()
            resetAutoScroll()
          }}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 justify-center gap-2">
          {productIds.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                current === index ? "bg-foreground" : "bg-muted-foreground/30",
              )}
              onClick={() => {
                api?.scrollTo(index)
                resetAutoScroll()
              }}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            api?.scrollNext()
            resetAutoScroll()
          }}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
