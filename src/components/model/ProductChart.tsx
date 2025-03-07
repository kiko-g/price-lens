"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Price, SupermarketProduct, ProductChartEntry } from "@/types"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { RANGES, DateRange } from "@/types/extra"
import { cn, discountValueToPercentage, formatTimestamptz, buildChartData } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { resolveSupermarketChain } from "./Supermarket"
import { EqualIcon, ExternalLinkIcon, ImageIcon, Loader2Icon, TriangleIcon } from "lucide-react"

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  "price-recommended": {
    label: "Price Recommended",
    color: "hsl(var(--chart-2))",
  },
  "price-per-major-unit": {
    label: "Price Per Unit",
    color: "hsl(var(--chart-3))",
  },
  discount: {
    label: "Discount",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function ProductChart({ sp, className }: { sp: SupermarketProduct; className?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange>("6M")
  const [prices, setPrices] = useState<Price[]>([])
  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const ceiling = useMemo(() => {
    const allPrices = prices
      .flatMap((p) => [p.price ?? -Infinity, p.price_recommended ?? -Infinity, p.price_per_major_unit ?? -Infinity])
      .filter((price) => price !== -Infinity && price !== null)

    return allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 0
  }, [prices])

  const priceVariation = useMemo(() => {
    const lastTwoPrices = prices.slice(-2)
    if (lastTwoPrices.length < 2) return 0

    const currentPrice = lastTwoPrices[1].price ?? 0
    const previousPrice = lastTwoPrices[0].price ?? 0

    console.debug("priceVariation", currentPrice, previousPrice)

    return (currentPrice - previousPrice) / previousPrice
  }, [prices])

  const priceRecommendedVariation = useMemo(() => {
    const lastTwoPrices = prices.slice(-2)
    if (lastTwoPrices.length < 2) return 0

    const currentPrice = lastTwoPrices[1].price_recommended ?? 0
    const previousPrice = lastTwoPrices[0].price_recommended ?? 0

    return (currentPrice - previousPrice) / previousPrice
  }, [prices])

  const pricePerMajorUnitVariation = useMemo(() => {
    const lastTwoPrices = prices.slice(-2)
    if (lastTwoPrices.length < 2) return 0

    const currentPrice = lastTwoPrices[1].price_per_major_unit ?? 0
    const previousPrice = lastTwoPrices[0].price_per_major_unit ?? 0

    return (currentPrice - previousPrice) / previousPrice
  }, [prices])

  const discountVariation = useMemo(() => {
    const lastTwoPrices = prices.slice(-2)
    if (lastTwoPrices.length < 2) return 0

    const currentDiscount = lastTwoPrices[1].discount ?? 0
    const previousDiscount = lastTwoPrices[0].discount ?? 0

    return currentDiscount - previousDiscount
  }, [prices])

  async function fetchPrices() {
    if (!sp.id) return

    setIsLoading(true)
    const response = await fetch(`/api/prices/get/${sp.id}`)
    const data = await response.json()
    if (data && data.length > 0) setPrices(data)
    setIsLoading(false)
  }

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchPrices()
    }
  }, [isMounted])

  useEffect(() => {
    if (!prices || prices.length === 0 || !isMounted) return

    const pricePoints = buildChartData(prices, selectedRange)
    setChartData(pricePoints)
  }, [selectedRange, prices, isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="-mt-2 mb-2 flex w-full items-center justify-between space-x-2 border-b pb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Link href={sp.url} target="_blank">
            {resolveSupermarketChain(sp)?.logo}
          </Link>
          <Button asChild variant="ghost" size="icon-xs" roundedness="sm">
            <Link href={sp.url} target="_blank">
              <ExternalLinkIcon />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 divide-x [&>span:not(:first-child)]:pl-1.5">
          <span>{sp.brand}</span>
          <span>{sp.category}</span>
        </div>
      </div>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex max-w-xs flex-1 flex-col items-center gap-0.5 text-xs font-medium md:text-sm">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-1" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price}€</span>
              <PriceChange variation={priceVariation} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-2" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Recommended</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_recommended}€</span>
              <PriceChange variation={priceRecommendedVariation} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-3" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">
                Price Per Unit ({sp.major_unit})
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_per_major_unit}€</span>
              <PriceChange variation={pricePerMajorUnitVariation} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-4" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Discount</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.discount ? discountValueToPercentage(sp.discount) : "0%"}</span>
              <PriceChange variation={discountVariation} />
            </div>
          </div>
        </div>

        {sp.image ? (
          <Image
            src={sp.image}
            alt={sp.name}
            width={100}
            height={100}
            className="h-20 w-20 rounded-md bg-white p-1 md:h-28 md:w-28"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </header>

      {isLoading ? (
        <LoadingChart />
      ) : chartData.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {RANGES.map((range) => (
              <Button
                key={range}
                variant={range === selectedRange ? "default" : "ghost"}
                onClick={() => setSelectedRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 8,
                bottom: 30,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => value.slice(0, 10)}
                tick={{ fontSize: 10 }}
                interval={Math.ceil(chartData.length / 6) - 1}
              />
              <YAxis
                yAxisId="price"
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => `€${value.toFixed(1)}`}
                domain={[0, ceiling]}
                ticks={[0, ceiling / 4, (ceiling * 2) / 4, (ceiling * 3) / 4, ceiling]}
              />
              <YAxis
                yAxisId="discount"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {Object.entries(chartConfig).map(([key, config], index) => (
                <Line
                  key={key}
                  yAxisId={key.includes("price") ? "price" : "discount"}
                  dataKey={key}
                  type="monotone"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={chartData.length > 1 ? { r: 0 } : { r: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </>
      ) : (
        <div className="flex h-64 w-full items-center justify-center rounded border bg-muted">
          <span className="text-sm text-muted-foreground">No price history data available</span>
        </div>
      )}

      <div className="flex w-full justify-between gap-2 pt-2 text-sm">
        <div className="flex w-full justify-end">
          <span className="text-xs text-muted-foreground">
            {sp.created_at || sp.updated_at ? `Last updated: ${formatTimestamptz(sp.updated_at)}` : "No update record"}
          </span>
        </div>
      </div>
    </div>
  )
}

function PriceChange({ variation }: { variation: number }) {
  const percentage = variation === 0 ? 0 : (variation * 100).toFixed(1)
  const positiveSign = variation > 0 ? "+" : ""

  return (
    <div className="flex min-w-16 items-center justify-end gap-1">
      <span className={cn(variation < 0 ? "text-green-500" : variation > 0 ? "text-red-500" : "text-muted-foreground")}>
        {positiveSign}
        {percentage}%
      </span>
      {variation === 0 ? (
        <EqualIcon className="h-3 w-3 text-muted-foreground" />
      ) : (
        <TriangleIcon
          className={cn(
            "h-3 w-3",
            variation < 0 ? "rotate-180 fill-green-500 stroke-green-500" : "fill-red-500 stroke-red-500",
          )}
        />
      )}
    </div>
  )
}

function LoadingChart() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2Icon className="h-4 w-4 animate-spin" />
    </div>
  )
}
