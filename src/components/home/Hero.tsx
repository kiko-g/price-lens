"use client"

import Link from "next/link"
import { cn, buildChartData } from "@/lib/utils"
import { useStoreProductWithPricesById, useAllProductsWithPrices } from "@/hooks/useProducts"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import type { StoreProduct, Price } from "@/types"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/magicui/border-beam"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { BadgeEuroIcon, ShoppingBasketIcon, TrendingUp, ImageIcon, ScanBarcodeIcon } from "lucide-react"
import { ceil, floor } from "lodash"
import { useMemo } from "react"
import { useState, useEffect } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

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
            <Link href="/products">
              Start Tracking
              <BadgeEuroIcon />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
            <Link href="/supermarket">
              Browse Supermarket
              <ShoppingBasketIcon />
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

function StaticMockChart({ className }: { className?: string }) {
  const chartDataA = [
    { month: "January", price: 4.99, priceRecommended: 5.99, discount: 17, pricePerUnit: 9.99 },
    { month: "February", price: 5.49, priceRecommended: 5.99, discount: 8, pricePerUnit: 10.98 },
    { month: "March", price: 5.99, priceRecommended: 6.49, discount: 8, pricePerUnit: 11.98 },
    { month: "April", price: 5.49, priceRecommended: 6.49, discount: 15, pricePerUnit: 10.98 },
    { month: "May", price: 4.99, priceRecommended: 6.49, discount: 23, pricePerUnit: 9.99 },
    { month: "June", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
    { month: "July", price: 6.49, priceRecommended: 6.99, discount: 7, pricePerUnit: 12.98 },
    { month: "August", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
    { month: "September", price: 5.49, priceRecommended: 6.49, discount: 15, pricePerUnit: 10.98 },
    { month: "October", price: 4.99, priceRecommended: 6.49, discount: 23, pricePerUnit: 9.99 },
    { month: "November", price: 5.99, priceRecommended: 6.99, discount: 14, pricePerUnit: 11.98 },
    { month: "December", price: 6.49, priceRecommended: 6.99, discount: 7, pricePerUnit: 16.0 },
  ]

  const chartConfigA = {
    price: {
      label: "Price",
      color: "var(--chart-1)",
    },
    priceRecommended: {
      label: "Price with discount",
      color: "var(--chart-2)",
    },
    pricePerUnit: {
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
      <CardHeader>
        <CardTitle>Price Evolution</CardTitle>
        <CardDescription>January - December 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigA}>
          <LineChart
            accessibilityLayer
            data={chartDataA}
            margin={{
              left: 0,
              right: 0,
              top: 8,
              bottom: 8,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              yAxisId="price"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 8]}
              tickFormatter={(value) => `€${value}`}
              width={40}
            />
            <YAxis
              yAxisId="discount"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              width={40}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              yAxisId="price"
              dataKey="price"
              type="linear"
              stroke="var(--color-price)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="price"
              dataKey="priceRecommended"
              type="linear"
              stroke="var(--color-priceRecommended)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="price"
              dataKey="pricePerUnit"
              type="linear"
              stroke="var(--color-pricePerUnit)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="discount"
              dataKey="discount"
              type="linear"
              stroke="var(--color-discount)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Showing price points for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>

      <BorderBeam duration={5} size={150} colorFrom="var(--color-primary)" colorTo="var(--color-secondary)" />
    </Card>
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

    return {
      priceChange,
      priceChangePercent,
      avgPrice,
      maxPrice,
      minPrice,
      isIncrease: priceChange > 0,
      isDecrease: priceChange < 0,
      isStable: priceChange === 0,
    }
  }, [productData?.prices])

  if (!productData) return <StaticMockChart className={cn("relative animate-pulse", className)} />

  const { storeProduct, prices } = productData
  const chartData = buildChartData(prices, "1M")

  const chartConfig = {
    price: {
      label: "Price",
      color: "var(--chart-1)",
    },
    "price-recommended": {
      label: "Price with discount",
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
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-start justify-start gap-4">
          {storeProduct.image ? (
            <img
              src={storeProduct.image}
              alt={storeProduct.name || "Product"}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="bg-muted flex size-24 items-center justify-center rounded-lg">
              <ImageIcon className="text-muted-foreground h-8 w-8" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{storeProduct.name}</h2>
            <p className="text-muted-foreground text-sm">
              More details on this product{" "}
              <Link href={`/supermarket/${storeProductId}`} className="underline">
                available here
                <ScanBarcodeIcon className="ml-1 inline-flex h-4 w-4" />
              </Link>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-6">
        <ChartContainer config={chartConfig}>
          <LineChart
            data={chartData}
            accessibilityLayer
            margin={{
              left: -10,
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
              domain={[0, priceStats?.maxPrice ? priceStats.maxPrice * 1.1 : 15]}
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
            <Line yAxisId="price" dataKey="price" type="linear" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line
              yAxisId="price"
              dataKey="price-recommended"
              type="linear"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
            <Line
              yAxisId="price"
              dataKey="price-per-major-unit"
              type="linear"
              stroke="var(--chart-3)"
              strokeWidth={2}
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
  const productIds = ["16258", "3807", "18728"]
  const [api, setApi] = useState<any>(null)
  const [current, setCurrent] = useState(0)

  const { data: allProductsData, isLoading } = useAllProductsWithPrices(productIds)

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
    if (!api) return

    const intervalId = setInterval(() => api.scrollNext(), interval)
    return () => clearInterval(intervalId)
  }, [api])

  if (isLoading || !allProductsData) {
    return (
      <div className={cn("relative rounded-lg border", className)}>
        <div className="animate-pulse">
          <StaticMockChart className="border-0" />
        </div>
      </div>
    )
  }

  const loadedProducts = Object.keys(allProductsData)
  if (loadedProducts.length === 0) {
    return (
      <div className={cn("relative rounded-lg border", className)}>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load product data</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Carousel
        className={cn("relative rounded-lg border", className)}
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-0 border-0">
          {productIds.map((productId, index) => (
            <CarouselItem key={productId} className="border-0 pl-0">
              <HandpickedShowcaseChart
                storeProductId={productId}
                className="border-0"
                productData={allProductsData[productId]}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <BorderBeam duration={5} size={150} colorFrom="var(--color-primary)" colorTo="var(--color-secondary)" />
      </Carousel>
    </>
  )
}
