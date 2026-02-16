import type { DateRange } from "@/types/business"
import type { Price, ProductChartEntry } from "@/types"
import { ChartConfig } from "@/components/ui/chart"
import { getDaysBetweenDates } from "@/lib/utils"

const MAX_CHART_POINTS = 200

export type ChartSamplingMode = "raw" | "hybrid" | "efficient"

type BuildChartDataOptions = {
  range?: DateRange
  samplingMode?: ChartSamplingMode
}

export function buildChartData(
  prices: Price[],
  options: BuildChartDataOptions | DateRange = "Max",
): ProductChartEntry[] {
  // Support both old signature (just range) and new signature (options object)
  const { range, samplingMode } =
    typeof options === "string"
      ? { range: options, samplingMode: "hybrid" as const }
      : { range: options.range ?? "1M", samplingMode: options.samplingMode ?? "hybrid" }

  const parseUTCDate = (dateStr: string): Date => {
    const date = new Date(dateStr)
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  const validPrices = prices.filter((p) => p.valid_from !== null)
  if (validPrices.length === 0) return []

  validPrices.sort((a, b) => a.valid_from!.localeCompare(b.valid_from!))

  type ProcessedPrice = {
    validFrom: Date
    validTo: Date | null
    price: number | null
    price_recommended: number | null
    price_per_major_unit: number | null
    discount: number | null
  }

  const processedPrices: ProcessedPrice[] = validPrices.map((p) => ({
    validFrom: parseUTCDate(p.valid_from!),
    validTo: p.valid_to ? parseUTCDate(p.valid_to) : null,
    price: p.price,
    price_recommended: p.price_recommended,
    price_per_major_unit: p.price_per_major_unit,
    discount: p.discount,
  }))

  // Adjust validTo dates to avoid overlaps
  for (let i = 0; i < processedPrices.length - 1; i++) {
    const current = processedPrices[i]
    const next = processedPrices[i + 1]
    const adjustedValidTo = new Date(next.validFrom)
    adjustedValidTo.setUTCDate(adjustedValidTo.getUTCDate() - 1)
    if (current.validTo === null || current.validTo > adjustedValidTo) {
      current.validTo = adjustedValidTo
    }
  }

  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  // Determine date range bounds
  let start: Date
  let end: Date

  if (range === "Max") {
    start = processedPrices[0].validFrom
    const latestPrice = processedPrices[processedPrices.length - 1]
    end = latestPrice.validTo || todayUTC
  } else {
    end = todayUTC
    start = new Date(end)
    const daysMap: Record<string, number> = {
      "1W": 7,
      "2W": 14,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "5Y": 365 * 5,
    }
    start.setUTCDate(end.getUTCDate() - (daysMap[range] || 30))
  }

  const totalDays = getDaysBetweenDates(start, end)
  const entries: ProductChartEntry[] = []
  const addedDates = new Set<string>()

  const addEntry = (date: Date, price: ProcessedPrice) => {
    const dateKey = date.toISOString().split("T")[0]
    if (addedDates.has(dateKey)) return
    addedDates.add(dateKey)

    entries.push({
      date: date.toISOString(),
      rawDate: date.toISOString(),
      price: price.price ?? 0,
      "price-per-major-unit": price.price_per_major_unit ?? 0,
      "price-recommended": price.price_recommended ?? 0,
      discount: price.discount ? price.discount * 100 : 0,
    })
  }

  // Find price at a given date
  const findPriceAtDate = (date: Date): ProcessedPrice | null => {
    for (let i = processedPrices.length - 1; i >= 0; i--) {
      const p = processedPrices[i]
      if (date >= p.validFrom && (p.validTo === null || date <= p.validTo)) {
        return p
      }
    }
    return null
  }

  // Add price change boundary points (used by both 'efficient' and 'hybrid' modes)
  const addPriceChangeBoundaries = () => {
    for (const price of processedPrices) {
      if (price.validFrom >= start && price.validFrom <= end) addEntry(price.validFrom, price)
      if (price.validTo && price.validTo >= start && price.validTo <= end) addEntry(price.validTo, price)
    }

    // Always include start and end dates
    const startPrice = findPriceAtDate(start)
    if (startPrice) addEntry(start, startPrice)

    const endPrice = findPriceAtDate(end)
    if (endPrice) addEntry(end, endPrice)
  }

  // Build entries based on sampling mode
  switch (samplingMode) {
    case "raw": {
      // 1 point per day (original behavior)
      const current = new Date(start)
      let priceIndex = 0
      while (current <= end) {
        while (priceIndex < processedPrices.length) {
          const price = processedPrices[priceIndex]
          if (current < price.validFrom) break
          if (price.validTo !== null && current > price.validTo) {
            priceIndex++
          } else {
            addEntry(new Date(current), price)
            break
          }
        }
        current.setUTCDate(current.getUTCDate() + 1)
      }
      break
    }

    case "efficient": {
      // Only price change boundaries (most resource-saving)
      addPriceChangeBoundaries()
      break
    }

    case "hybrid":
    default: {
      // Price change boundaries + interval samples
      addPriceChangeBoundaries()

      // Add interval samples for smoother appearance
      const samplingInterval = Math.max(1, Math.ceil(totalDays / MAX_CHART_POINTS))
      const current = new Date(start)
      while (current <= end) {
        const price = findPriceAtDate(current)
        if (price) {
          addEntry(new Date(current), price)
        }
        current.setUTCDate(current.getUTCDate() + samplingInterval)
      }
      break
    }
  }

  // Sort entries by date
  entries.sort((a, b) => a.date.localeCompare(b.date))

  // Format dates for display (keep rawDate for tooltip)
  return entries.map((entry) => ({
    ...entry,
    date: formatDateForChart(entry.date, totalDays),
  }))
}

function formatDateForChart(dateString: string, totalDays: number = 30): string {
  const date = new Date(dateString)

  // For very long ranges (> 1 year), show month + year
  if (totalDays > 365) {
    return date.toLocaleString(undefined, {
      month: "short",
      year: "2-digit",
    })
  }

  // For medium ranges (> 2 months), show day + month
  if (totalDays > 60) {
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
    })
  }

  // For short ranges, show day + month
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
  })
}

export const chartConfig = {
  price: {
    label: "Price",
    color: "var(--chart-1)",
  },
  "price-recommended": {
    label: "Price without discount",
    color: "var(--chart-2)",
  },
  "price-per-major-unit": {
    label: "Price per major unit",
    color: "var(--chart-3)",
  },
  discount: {
    label: "Discount %",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

/**
 * Calculate a "nice" number for axis intervals
 * Based on the "Nice Numbers for Graph Labels" algorithm by Paul Heckbert
 */
function getNiceNumber(value: number, round: boolean): number {
  if (value === 0) return 0

  const exponent = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exponent)

  let niceFraction: number
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }

  return niceFraction * Math.pow(10, exponent)
}

export type ChartBounds = {
  floor: number
  ceiling: number
  tickInterval: number
  ticks: number[]
}

/**
 * Calculate chart bounds with nice numbers for Y-axis
 * Uses a hybrid approach: nice numbers with guaranteed minimum padding
 */
export function calculateChartBounds(min: number, max: number, targetTicks: number = 6): ChartBounds {
  // Handle edge cases
  if (min === max) {
    const padding = min === 0 ? 1 : min * 0.2
    min = min - padding
    max = max + padding
  }

  const isMicro = max < 1.5

  // Ensure min is never negative for price data
  const safeMin = Math.max(0, min)

  // For micro prices (< €1.50), use more aggressive padding and fewer ticks
  const paddingRatio = isMicro ? 0.4 : 0.15
  const effectiveTargetTicks = isMicro ? 4 : targetTicks

  // Calculate raw range with padding
  const rawRange = max - safeMin
  const paddedMin = Math.max(0, safeMin - rawRange * paddingRatio)
  const paddedMax = max + rawRange * paddingRatio

  // Calculate nice tick interval
  const paddedRange = paddedMax - paddedMin
  const roughTickInterval = paddedRange / (effectiveTargetTicks - 1)
  const tickInterval = getNiceNumber(roughTickInterval, true)

  // Calculate nice floor and ceiling aligned to tick interval
  const floor = Math.floor(paddedMin / tickInterval) * tickInterval
  const ceiling = Math.ceil(paddedMax / tickInterval) * tickInterval

  // Ensure floor is never negative for prices
  const safeFloor = Math.max(0, floor)

  // Generate tick values
  const ticks: number[] = []
  for (let tick = safeFloor; tick <= ceiling + tickInterval * 0.001; tick += tickInterval) {
    ticks.push(Math.round(tick * 1000) / 1000) // Round to avoid floating point issues
  }

  // Ensure we have at least 2 ticks
  if (ticks.length < 2) {
    ticks.push(ticks[0] + tickInterval)
  }

  return {
    floor: safeFloor,
    ceiling: ticks[ticks.length - 1],
    tickInterval,
    ticks,
  }
}

/**
 * Get a short version of relative time for compact displays (e.g. "6mo", "2w")
 */
export function getShortRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "1d"
  if (diffDays < 7) return `${diffDays}d`
  if (diffWeeks === 1) return "1w"
  if (diffWeeks < 12) return `${diffWeeks}w`
  if (diffMonths < 12 && diffMonths > 0) return `${diffMonths}mo`
  if (diffYears === 1) return "1y"
  return `${diffYears}y`
}

/**
 * Get a human-readable relative time (e.g. "6 months", "2 weeks", "1 year")
 */
export function getLongRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "1 day"
  if (diffDays < 7) return `${diffDays} days`
  if (diffWeeks === 1) return "1 week"
  if (diffWeeks < 12) return `${diffWeeks} weeks`
  if (diffMonths === 1) return "1 month"
  if (diffMonths < 12 && diffMonths > 0) return `${diffMonths} months`
  if (diffYears === 1) return "1 year"
  return `${diffYears} years`
}
