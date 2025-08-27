"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BorderBeam } from "@/components/magicui/border-beam"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { BadgeEuroIcon, ShoppingBasketIcon, TrendingUp } from "lucide-react"
import { useStoreProductById } from "@/hooks/useProducts"

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
        <StaticMockChart className="border-border w-full bg-linear-to-br shadow-none" />
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
  const { data: cereaisFitnessChocolate, isLoading } = useStoreProductById("18728")
  if (isLoading) return <p>Loading...</p>
  if (!cereaisFitnessChocolate) return <p>No data</p>

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
    pricePerUnit: {
      label: "Price Per Unit",
      color: "var(--chart-2)",
    },
    priceRecommended: {
      label: "Price Recommended",
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

function HandpickedShowcaseCharts({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Handpicked Showcase Charts</h2>
        <p className="text-muted-foreground text-sm">
          These are some of the charts that we think are interesting and worth showing.
        </p>
      </div>
      <div className="flex flex-col gap-4"></div>
    </div>
  )
}
