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
      case "1M":
        // last 1 month of data
        return chartData.slice(-1)
      case "3M":
        // last 3 months
        return chartData.slice(-3)
      case "6M":
        // last 6 months
        return chartData.slice(-6)
      case "1Y":
        // If you had 12 months in chartData, you'd do chartData.slice(-12)
        return chartData.slice(-6) // fallback, since we only have 6 data points
      case "5Y":
        // If you had multiple years of data, you can filter accordingly
        return chartData
      case "Max":
      default:
        return chartData
    }
  }, [selectedRange])

  return (
    <div className={cn(className)}>
      <div className="mb-10 flex items-center gap-3">
        <span className="flex items-center gap-2 font-bold">{product.price}€</span>
        <span className="flex items-center gap-1 font-semibold text-green-500">
          4.5%
          <TriangleIcon className="h-3 w-3 rotate-180 fill-green-500" />
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Button
            key={range}
            variant={range === selectedRange ? "secondary" : "ghost"}
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

      <div className="mt-6 flex w-full justify-between gap-2 border-t pt-3 text-sm">
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
