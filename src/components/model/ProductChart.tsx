"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Price, SupermarketProduct, ProductChartEntry } from "@/types"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { RANGES, DateRange, daysAmountInRange } from "@/types/extra"
import { cn, buildChartData, getDaysBetweenDates } from "@/lib/utils"
import { ImageIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PricesVariationCard } from "./PricesVariationCard"

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

type Props = {
  sp: SupermarketProduct
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
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [prices, setPrices] = useState<Price[]>([])
  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange>("Max")
  const [activeAxis, setActiveAxis] = useState<string[]>(["price", "price-per-major-unit"])

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

  const minDate = useMemo(() => {
    if (prices.length === 0) return null

    return prices.reduce<string | null>((min, price) => {
      const validFrom = price.valid_from ?? null
      const updatedAt = price.updated_at ?? null

      if (validFrom === null && updatedAt === null) return min
      if (min === null) return validFrom !== null ? validFrom : updatedAt
      if (validFrom !== null && validFrom < min) return validFrom
      if (updatedAt !== null && updatedAt < min) return updatedAt

      return min
    }, null)
  }, [prices])

  const maxDate = useMemo(() => {
    if (prices.length === 0) return null

    return prices.reduce<string | null>((max, price) => {
      const validTo = price.valid_to ?? null
      const updatedAt = price.updated_at ?? null

      if (validTo === null && updatedAt === null) return max
      if (max === null) return validTo !== null ? validTo : updatedAt
      if (validTo !== null && validTo > max) return validTo

      return max
    }, null)
  }, [prices])

  const daysBetweenDates = useMemo(() => {
    if (!minDate || !maxDate) return 0

    const minDateObj = new Date(minDate)
    const maxDateObj = new Date(maxDate)

    return getDaysBetweenDates(minDateObj, maxDateObj)
  }, [minDate, maxDate])

  async function fetchPrices() {
    if (!sp.id) return

    setIsLoading(true)
    const response = await fetch(`/api/prices/get/${sp.id}`)
    const data = await response.json()
    if (data && data.length > 0) setPrices(data)
    setIsLoading(false)
  }

  function handleAxisChange(axis: string) {
    if (activeAxis.includes(axis)) setActiveAxis(activeAxis.filter((a) => a !== axis))
    else setActiveAxis([...activeAxis, axis])
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

  if (!isMounted) return null

  return (
    <div className={cn("flex flex-col", className)}>
      {options?.showPricesVariationCard || options?.showImage ? (
        <header className="mb-6 flex items-start justify-between gap-4">
          {options?.showPricesVariationCard ? (
            <PricesVariationCard
              data={{
                price: sp.price,
                priceRecommended: sp.price_recommended,
                pricePerMajorUnit: sp.price_per_major_unit,
                discount: sp.discount,
                discountVariation,
                priceVariation,
                priceRecommendedVariation,
                pricePerMajorUnitVariation,
              }}
              state={{
                activeAxis,
              }}
              actions={{
                onPriceChange: () => handleAxisChange("price"),
                onPriceRecommendedChange: () => handleAxisChange("price-recommended"),
                onPricePerMajorUnitChange: () => handleAxisChange("price-per-major-unit"),
                onDiscountChange: () => handleAxisChange("discount"),
              }}
              className="max-w-xs text-xs font-medium md:text-sm"
            />
          ) : null}

          {options?.showImage ? (
            sp.image ? (
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
            )
          ) : null}
        </header>
      ) : null}

      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2Icon className="h-4 w-4 animate-spin" />
        </div>
      ) : chartData.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {RANGES.map((range) => (
              <Button
                key={range}
                variant={range === selectedRange ? "default" : "ghost"}
                onClick={() => setSelectedRange(range)}
                disabled={range !== "Max" && daysBetweenDates < daysAmountInRange[range]}
                className="disabled:text-muted-foreground"
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
              {Object.entries(chartConfig)
                .filter(([key]) => activeAxis.includes(key))
                .map(([key, config], index) => (
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
    </div>
  )
}
