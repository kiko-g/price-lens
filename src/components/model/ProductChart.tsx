"use client"

import axios from "axios"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Price, StoreProduct, ProductChartEntry } from "@/types"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { RANGES, DateRange, daysAmountInRange } from "@/types/extra"
import { cn, buildChartData, getDaysBetweenDates } from "@/lib/utils"
import { ImageIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PricesVariationCard } from "./PricesVariationCard"
import { useActiveAxis } from "@/hooks/useActiveAxis"

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  "price-per-major-unit": {
    label: "Price Per Major Unit",
    color: "hsl(var(--chart-3))",
  },
  "price-recommended": {
    label: "Price Recommended",
    color: "hsl(var(--chart-2))",
  },
  discount: {
    label: "Discount",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

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
  const [isLoading, setIsLoading] = useState(false)
  const [prices, setPrices] = useState<Price[]>([])
  const [chartData, setChartData] = useState<ProductChartEntry[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange>("Max")
  const [activeAxis, updateActiveAxis] = useActiveAxis()

  function getLineChartConfig(axis: string, chartDataLength: number) {
    const isSinglePoint = chartDataLength === 1

    switch (axis) {
      case "price-recommended":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "6 6",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: 3,
        }
      case "price-per-major-unit":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "4 4",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: 3,
        }
      case "discount":
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "5 5",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: 2,
        }
      case "price":
      default:
        return {
          strokeDasharray: isSinglePoint ? "0 0" : "0 0",
          dot: isSinglePoint ? { r: 2 } : { r: 0 },
          activeDot: { r: 5 },
          strokeWidth: 3.5,
        }
    }
  }

  const { floor, ceiling } = useMemo(() => {
    const allPrices = prices
      .flatMap((p) => [
        activeAxis.includes("price") ? (p.price ?? -Infinity) : -Infinity,
        activeAxis.includes("price-recommended") ? (p.price_recommended ?? -Infinity) : -Infinity,
        activeAxis.includes("price-per-major-unit") ? (p.price_per_major_unit ?? -Infinity) : -Infinity,
      ])
      .filter((price) => price !== -Infinity && price !== null)

    if (allPrices.length === 0) return { floor: 0, ceiling: 0 }

    return {
      floor: Math.floor(Math.min(...allPrices)),
      ceiling: Math.ceil(Math.max(...allPrices)),
    }
  }, [prices, activeAxis])

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
    await new Promise((resolve) => setTimeout(resolve, 400))
    const response = await axios.get(`/api/prices/${sp.id}`)
    if (response.status === 200) {
      const data = response.data
      if (data && data.length > 0) setPrices(data)
    }
    setIsLoading(false)
  }

  function handleAxisChange(axis: string) {
    const newAxis = activeAxis.includes(axis) ? activeAxis.filter((a) => a !== axis) : [...activeAxis, axis]
    updateActiveAxis(newAxis)
  }

  useEffect(() => {
    fetchPrices()
  }, [])

  useEffect(() => {
    if (!prices || prices.length === 0) return

    const pricePoints = buildChartData(prices, selectedRange)
    setChartData(pricePoints)
  }, [selectedRange, prices])

  return (
    <div className={cn("flex w-full flex-col", className)}>
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
                src={sp.image.replace(/&sm=fit/g, "")}
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {RANGES.map((range) => (
          <Button
            key={range}
            variant={range === selectedRange ? "default" : "ghost"}
            onClick={() => setSelectedRange(range)}
            disabled={range !== "Max" && daysBetweenDates < daysAmountInRange[range]}
            className="px-2 text-xs disabled:text-muted-foreground lg:text-sm"
          >
            {range}
          </Button>
        ))}
        {isLoading && <Loader2Icon className="ml-4 h-5 w-5 animate-spin" />}
      </div>
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
            domain={[floor * 0.5, ceiling * 1.05]}
            ticks={Array.from({ length: 5 }, (_, i) => floor / 2 + ((ceiling - floor / 2) * i) / 4).map(
              (tick, index) => tick + index * 0.0001,
            )}
            tickFormatter={(value) => `€${value.toFixed(1)}`}
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
  )
}

function CustomTick({ x, y, payload, yAxisId }: { x: number; y: number; payload: any; yAxisId: string }) {
  return (
    <text x={x} y={y} textAnchor="end" fill="#666" key={`${yAxisId}-tick-${payload.value}`}>
      {yAxisId === "price" ? `€${payload.value.toFixed(1)}` : `${payload.value}%`}
    </text>
  )
}
