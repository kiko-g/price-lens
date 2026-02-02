"use client"

import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts"

import type { StoreProduct, Price } from "@/types"
import { STORE_NAMES, DateRange } from "@/types/business"
import { cn } from "@/lib/utils"
import { buildChartData, calculateChartBounds } from "@/lib/business/chart"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Map store origin_id to chart colors (skip chart-3 as it's yellow/hard to see)
const STORE_CHART_COLORS: Record<number, string> = {
  1: "var(--chart-1)", // Continente → Blue
  2: "var(--chart-2)", // Auchan → Coral
  3: "var(--chart-4)", // Pingo Doce → Teal/Green
}

// Fallback colors for additional stores
const FALLBACK_COLORS = [
  "var(--chart-5)", // Purple
  "var(--chart-3)", // Yellow (last resort)
]

// Different dash patterns to distinguish overlapping lines
const STROKE_DASH_PATTERNS = [
  "0", // Solid
  "8 4", // Dashed
  "2 2", // Dotted
  "8 4 2 4", // Dash-dot
]

interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

interface ComparisonChartProps {
  productsWithPrices: ProductWithPrices[]
  selectedRange: DateRange
  className?: string
}

type MergedDataPoint = {
  date: string
  rawDate: string
  [key: string]: number | string | null // Dynamic keys for each store's price
}

function getStoreColor(originId: number | null, index: number): string {
  if (originId && STORE_CHART_COLORS[originId]) {
    return STORE_CHART_COLORS[originId]
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function getStoreName(originId: number | null): string {
  if (originId && STORE_NAMES[originId]) {
    return STORE_NAMES[originId]
  }
  return `Store ${originId || "Unknown"}`
}

function formatTrackingSince(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

export function ComparisonChart({ productsWithPrices, selectedRange, className }: ComparisonChartProps) {
  // Build chart data for each product and merge by date
  const { mergedData, chartBounds, storeKeys } = useMemo(() => {
    if (productsWithPrices.length === 0) {
      return { mergedData: [], chartBounds: { floor: 0, ceiling: 1, ticks: [0, 1] }, storeKeys: [] }
    }

    // Build chart data for each product
    const allChartData = productsWithPrices.map(({ product, prices }) => ({
      product,
      data: buildChartData(prices, { range: selectedRange, samplingMode: "efficient" }),
    }))
    console.info(allChartData)

    // Create a map of all dates to their data points
    const dateMap = new Map<string, MergedDataPoint>()

    // Generate store keys based on origin_id
    const storeKeys: {
      key: string
      originId: number | null
      name: string
      color: string
      dashPattern: string
      index: number
      dataPointCount: number
      trackingSince: string | null
    }[] = []

    allChartData.forEach(({ product, data }, index) => {
      const originId = product.origin_id
      const key = `store_${originId || index}`
      const name = getStoreName(originId)
      const color = getStoreColor(originId, index)

      // Only add if not already present (avoid duplicates for same store)
      if (!storeKeys.find((s) => s.key === key)) {
        const storeIndex = storeKeys.length
        const earliestDate = data.length > 0 ? data[0].rawDate : null
        storeKeys.push({
          key,
          originId,
          name,
          color,
          dashPattern: STROKE_DASH_PATTERNS[storeIndex % STROKE_DASH_PATTERNS.length],
          index: storeIndex,
          dataPointCount: data.length,
          trackingSince: earliestDate,
        })
      }

      data.forEach((point) => {
        const rawDate = point.rawDate
        if (!dateMap.has(rawDate)) {
          dateMap.set(rawDate, {
            date: point.date,
            rawDate,
          })
        }
        const existing = dateMap.get(rawDate)!
        existing[key] = point.price
      })
    })

    // Convert map to array and sort by date
    const mergedData = Array.from(dateMap.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate))

    // Calculate bounds based on all visible prices
    const allPrices = mergedData.flatMap((point) =>
      storeKeys.map((s) => point[s.key]).filter((p): p is number => typeof p === "number" && p > 0),
    )

    const chartBounds =
      allPrices.length > 0
        ? calculateChartBounds(Math.min(...allPrices), Math.max(...allPrices))
        : { floor: 0, ceiling: 1, tickInterval: 0.5, ticks: [0, 0.5, 1] }

    return { mergedData, chartBounds, storeKeys }
  }, [productsWithPrices, selectedRange])

  // Calculate x-axis tick interval
  const xAxisTickInterval = useMemo(() => {
    const dataLength = mergedData.length
    if (dataLength <= 8) return 0
    return Math.floor(dataLength / 8)
  }, [mergedData.length])

  // Build chart config for ChartContainer
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    storeKeys.forEach(({ key, name, color }) => {
      config[key] = { label: name, color }
    })
    return config
  }, [storeKeys])

  if (mergedData.length === 0) {
    return (
      <div className={cn("bg-muted/20 flex h-[300px] items-center justify-center rounded-lg border", className)}>
        <p className="text-muted-foreground text-sm">No price history available</p>
      </div>
    )
  }

  return (
    <div className={cn("bg-card rounded-lg border p-4", className)}>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={mergedData} margin={{ left: 4, right: 12, top: 12, bottom: 30 }}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={xAxisTickInterval}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            orientation="left"
            tickLine={false}
            axisLine={false}
            width={45}
            type="number"
            domain={[chartBounds.floor, chartBounds.ceiling]}
            ticks={chartBounds.ticks}
            tickFormatter={(value) => `€${value.toFixed(value < 10 ? 2 : 0)}`}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const rawDate = (payload[0] as { payload?: { rawDate?: string } })?.payload?.rawDate
                  if (!rawDate) return ""
                  return new Date(rawDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                }}
                formatter={(value, name) => {
                  const storeKey = storeKeys.find((s) => s.key === name)
                  const displayName = storeKey?.name || name
                  return (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: storeKey?.color || "var(--chart-1)" }}
                      />
                      <span>{displayName}:</span>
                      <span className="font-semibold">{typeof value === "number" ? `€${value.toFixed(2)}` : "-"}</span>
                    </span>
                  )
                }}
              />
            }
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            content={({ payload }) => (
              <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
                {payload?.map((entry, index) => {
                  const storeKey = storeKeys.find((s) => s.key === entry.dataKey)
                  const trackingSinceText = storeKey?.trackingSince
                    ? `since ${formatTrackingSince(storeKey.trackingSince)}`
                    : ""
                  return (
                    <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
                      <svg width="24" height="12" className="shrink-0">
                        <line
                          x1="0"
                          y1="6"
                          x2="24"
                          y2="6"
                          stroke={entry.color}
                          strokeWidth={2.5}
                          strokeDasharray={storeKey?.dashPattern || "0"}
                        />
                        <circle cx="12" cy="6" r="3" fill={entry.color} />
                      </svg>
                      <span>{storeKey?.name || entry.value}</span>
                      {trackingSinceText && <span className="text-muted-foreground text-xs">{trackingSinceText}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          />
          {storeKeys.map(({ key, color, dashPattern }) => (
            <Line
              key={key}
              dataKey={key}
              type="linear"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray={dashPattern}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "var(--background)" }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
