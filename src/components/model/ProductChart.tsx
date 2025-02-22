"use client"

import * as React from "react"
import { Product } from "@/types"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function getRangeLabel(range: Range) {
  switch (range) {
    case "1M":
      return "1 month"
    case "3M":
      return "3 months"
    case "6M":
      return "6 months"
    case "1Y":
      return "1 year"
    case "5Y":
      return "5 years"
    case "Max":
      return "all available months"
  }
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  // ... You can add more data to handle 1Y, 5Y, etc. if needed
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

// Possible range options
const RANGES = ["1M", "3M", "6M", "1Y", "5Y", "Max"] as const
type Range = (typeof RANGES)[number]

export function ProductChart({ product }: { product: Product }) {
  // Track the selected range
  const [selectedRange, setSelectedRange] = React.useState<Range>("6M")

  // A helper to filter the data based on the selected range
  // (Right now, we only have 6 data points, so the slice logic is minimal,
  // but you can expand with more data for 1Y, 5Y, etc.)
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
    <Card>
      <CardHeader>
        <CardTitle>Price Evolution</CardTitle>
        <CardDescription>Select a range to see the price variations.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing price evolution for the last{" "}
          <strong className="dark:text-white">{getRangeLabel(selectedRange)}</strong>
        </div>
      </CardFooter>
    </Card>
  )
}
