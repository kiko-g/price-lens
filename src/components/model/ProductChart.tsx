"use client"

import * as React from "react"
import { SupermarketProduct } from "@/types"
import { TrendingUp, TriangleIcon } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatTimestamptz } from "@/lib/utils"
import { RANGES, Range } from "@/types/extra"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Price",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ProductChart({ product, className }: { product: SupermarketProduct; className?: string }) {
  const [selectedRange, setSelectedRange] = React.useState<Range>("6M")

  const filteredData = React.useMemo(() => {
    switch (selectedRange) {
      case "1W":
        return chartData.slice(-7)
      case "1M":
        return chartData.slice(-1)
      case "3M":
        return chartData.slice(-3)
      case "6M":
        return chartData.slice(-6)
      case "1Y":
        return chartData.slice(-6)
      case "5Y":
        return chartData
      case "Max":
      default:
        return chartData
    }
  }, [selectedRange])

  return (
    <div className={cn(className)}>
      <div className="mb-6 flex max-w-xs flex-col items-center gap-0.5 text-sm font-medium">
        {/* Price */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-chart-1" />
            <span className="text-muted-foreground">Price</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1">{product.price}€</span>
            <PriceChange variation={0.0452} />
          </div>
        </div>

        {/* Price Recommended */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-chart-2" />
            <span className="text-muted-foreground">Price Recommended</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1">{product.price_recommended}€</span>
            <PriceChange variation={-0.0554} />
          </div>
        </div>

        {/* Price Per Major Unit */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-chart-3" />
            <span className="text-muted-foreground">Price Per Major Unit</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1">{product.price_per_major_unit}€</span>
            <PriceChange variation={0.0851} />
          </div>
        </div>

        {/* Price Recommended */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-chart-4" />
            <span className="text-muted-foreground">Discount</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-1">{product.discount}%</span>
            <PriceChange variation={-0.0343} />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
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
          }}
        >
          <CartesianGrid vertical={false} />
          <YAxis tickLine={false} axisLine={false} width={24} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line
            dataKey="desktop"
            type="linear"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-desktop)",
            }}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>

      <div className="flex w-full justify-between gap-2 pt-2 text-sm">
        <div className="flex w-full justify-end">
          <span className="text-xs text-muted-foreground">
            {product.created_at || product.updated_at
              ? `Last updated: ${formatTimestamptz(product.updated_at)}`
              : "No update record"}
          </span>
        </div>
      </div>
    </div>
  )
}

function PriceChange({ variation }: { variation: number }) {
  const percentage = (variation * 100).toFixed(1)

  return (
    <div className="flex items-center gap-1">
      <span className={cn(variation < 0 ? "text-green-500" : "text-red-500")}>{percentage}%</span>
      <TriangleIcon
        className={cn(
          "h-3 w-3",
          variation < 0 ? "rotate-180 fill-green-500 stroke-green-500" : "fill-red-500 stroke-red-500",
        )}
      />
    </div>
  )
}
