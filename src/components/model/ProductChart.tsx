"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { SupermarketProduct } from "@/types"
import { ExternalLinkIcon, ImageIcon, TriangleIcon } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn, discountValueToPercentage, formatTimestamptz } from "@/lib/utils"
import { RANGES, Range } from "@/types/extra"
import { resolveSupermarketChain } from "./Supermarket"

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

export function ProductChart({ sp, className }: { sp: SupermarketProduct; className?: string }) {
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
        <div className="flex max-w-xs flex-1 flex-col items-center gap-0.5 text-sm font-medium">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-1" />
              <span className="text-muted-foreground">Price</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price}€</span>
              <PriceChange variation={0.0452} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-2" />
              <span className="text-muted-foreground">Price Recommended</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_recommended}€</span>
              <PriceChange variation={-0.0554} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-3" />
              <span className="text-muted-foreground">Price Per Major Unit</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_per_major_unit}€</span>
              <PriceChange variation={0.0851} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-4" />
              <span className="text-muted-foreground">Discount</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.discount ? discountValueToPercentage(sp.discount) : "N/A"}</span>
              <PriceChange variation={-0.0343} />
            </div>
          </div>
        </div>

        {sp.image ? (
          <Image src={sp.image} alt={sp.name} width={100} height={100} className="h-28 w-28 rounded-md bg-white p-1" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </header>

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
            {sp.created_at || sp.updated_at ? `Last updated: ${formatTimestamptz(sp.updated_at)}` : "No update record"}
          </span>
        </div>
      </div>
    </div>
  )
}

function PriceChange({ variation }: { variation: number }) {
  const percentage = (variation * 100).toFixed(1)
  const positiveSign = variation > 0 ? "+" : ""

  return (
    <div className="flex w-16 items-center justify-end gap-1">
      <span className={cn(variation < 0 ? "text-green-500" : "text-red-500")}>
        {positiveSign}
        {percentage}%
      </span>
      <TriangleIcon
        className={cn(
          "h-3 w-3",
          variation < 0 ? "rotate-180 fill-green-500 stroke-green-500" : "fill-red-500 stroke-red-500",
        )}
      />
    </div>
  )
}
