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
import { ExternalLinkIcon, ImageIcon, TriangleIcon } from "lucide-react"

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
  const [selectedRange, setSelectedRange] = useState<DateRange>("6M")
  const [prices, setPrices] = useState<Price[]>([])
  const [chartData, setChartData] = useState<ProductChartEntry[]>([])

  async function fetchPrices() {
    if (!sp.id) return

    const response = await fetch(`/api/prices/${sp.id}`)
    const data = await response.json()
    if (data && data.length > 0) {
      setPrices(data)
      const pricePoints = buildChartData(data, selectedRange)
      setChartData(pricePoints)
    }
  }

  useEffect(() => {
    fetchPrices()
  }, [sp.id])

  useEffect(() => {
    const pricePoints = buildChartData(prices, selectedRange)
    setChartData(pricePoints)
  }, [selectedRange, prices])

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
              <PriceChange variation={0.0452} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-2" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Recommended</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_recommended}€</span>
              <PriceChange variation={-0.0554} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-3" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Price Per Major Unit</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.price_per_major_unit}€</span>
              <PriceChange variation={0.0851} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-4" />
              <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-50">Discount</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="mr-1">{sp.discount ? discountValueToPercentage(sp.discount) : "N/A"}</span>
              <PriceChange variation={-0.0343} />
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
            top: 8,
            bottom: 30, // Increased bottom margin to accommodate diagonal labels
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
            interval={Math.ceil(chartData.length / 5) - 1} // Ensure no more than 5 labels are shown
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
          {Object.entries(chartConfig).map(([key, config], index) => (
            <Line
              key={key}
              yAxisId={key.includes("price") ? "price" : "discount"}
              dataKey={key}
              type="monotone"
              stroke={config.color}
              strokeWidth={key === "price" ? 4 : 2}
              dot={{ r: 0 }}
              activeDot={{ r: 6 }}
            />
          ))}
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
    <div className="flex w-14 items-center justify-end gap-1">
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
