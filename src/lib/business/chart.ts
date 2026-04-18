import type { DateRange } from "@/types/business"
import type { Price, ProductChartEntry } from "@/types"
import { ChartConfig } from "@/components/ui/chart"
import { getDaysBetweenDates } from "@/lib/utils"
import { isLocale, toLocaleTag, type Locale } from "@/i18n/config"

const MAX_CHART_POINTS = 200

export type ChartSamplingMode = "raw" | "hybrid" | "efficient"

/** UTC midnight for the calendar day in `YYYY-MM-DD` or ISO string (date portion only). */
export function chartTimeMsFromRawDate(rawDate: string): number {
  const day = rawDate.split("T")[0]
  const [y, m, d] = day.split("-").map(Number)
  if (!y || !m || !d) return Date.parse(rawDate)
  return Date.UTC(y, m - 1, d)
}

export function formatChartAxisTick(timeMs: number, spanDays: number, locale?: Locale | string): string {
  const tag = locale && isLocale(locale) ? toLocaleTag(locale) : typeof locale === "string" ? locale : toLocaleTag("pt")
  const date = new Date(timeMs)
  if (spanDays > 365) {
    return date.toLocaleString(tag, { month: "short", year: "2-digit" })
  }
  if (spanDays > 60) {
    return date.toLocaleString(tag, { day: "2-digit", month: "short" })
  }
  return date.toLocaleString(tag, { day: "numeric", month: "short" })
}

type BuildChartDataOptions = {
  range?: DateRange
  samplingMode?: ChartSamplingMode
  locale?: Locale | string
}

export function buildChartData(
  prices: Price[],
  options: BuildChartDataOptions | DateRange = "Max",
): ProductChartEntry[] {
  // Support both old signature (just range) and new signature (options object)
  const { range, samplingMode, locale } =
    typeof options === "string"
      ? { range: options, samplingMode: "hybrid" as const, locale: undefined as Locale | string | undefined }
      : {
          range: options.range ?? "1M",
          samplingMode: options.samplingMode ?? "hybrid",
          locale: options.locale,
        }

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
      timeMs: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      price: price.price ?? 0,
      "price-per-major-unit": price.price_per_major_unit ?? 0,
      "price-recommended": price.price_recommended ?? 0,
      discount: price.discount ? price.discount * 100 : 0,
    })
  }

  // Find price at a given date (interval match, then last row with validFrom <= date for small gaps)
  const findPriceAtDate = (date: Date): ProcessedPrice | null => {
    for (let i = processedPrices.length - 1; i >= 0; i--) {
      const p = processedPrices[i]
      if (date >= p.validFrom && (p.validTo === null || date <= p.validTo)) {
        return p
      }
    }
    let lastStarted: ProcessedPrice | null = null
    for (const p of processedPrices) {
      if (p.validFrom <= date) {
        lastStarted = p
      }
    }
    return lastStarted
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
    date: formatDateForChart(entry.date, totalDays, locale),
  }))
}

function formatDateForChart(dateString: string, totalDays: number = 30, locale?: Locale | string): string {
  return formatChartAxisTick(new Date(dateString).getTime(), totalDays, locale)
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
export function calculateChartBounds(min: number, max: number, targetTicks: number = 10): ChartBounds {
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
  const effectiveTargetTicks = isMicro ? 6 : targetTicks

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

export type RelativeTimeMode = "short" | "long" | "relative"

const RELATIVE_LABELS: Record<
  "en" | "pt",
  {
    today: string
    d: string
    w: string
    mo: string
    y: string
    ago: string
    day: [string, string]
    week: [string, string]
    month: [string, string]
    year: [string, string]
  }
> = {
  en: {
    today: "today",
    d: "d",
    w: "w",
    mo: "mo",
    y: "y",
    ago: " ago",
    day: ["day", "days"],
    week: ["week", "weeks"],
    month: ["month", "months"],
    year: ["year", "years"],
  },
  pt: {
    today: "hoje",
    d: "d",
    w: "sem",
    mo: "m",
    y: "a",
    ago: " atrás",
    day: ["dia", "dias"],
    week: ["semana", "semanas"],
    month: ["mês", "meses"],
    year: ["ano", "anos"],
  },
}

function pluralLabel(value: number, singular: string, plural: string): string {
  return value === 1 ? `${value} ${singular}` : `${value} ${plural}`
}

/**
 * Unified relative time formatter with 3 display modes:
 * - "short": compact (today, 3d, 2w, 6mo, 1y)
 * - "long": noun form (today, 3 days, 2 weeks, 6 months, 1 year)
 * - "relative": sentence-like (today, 3 days ago, 2 weeks ago, 6 months ago)
 */
export function formatRelativeTime(date: Date, mode: RelativeTimeMode = "short", locale: Locale = "pt"): string {
  const labels = RELATIVE_LABELS[locale] ?? RELATIVE_LABELS.pt
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return labels.today

  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  const suffix = mode === "relative" ? labels.ago : ""

  if (diffDays < 14) {
    if (mode === "short") return `${diffDays}${labels.d}`
    return `${pluralLabel(diffDays, labels.day[0], labels.day[1])}${suffix}`
  }

  if (diffDays < 30) {
    if (mode === "short") return `${diffWeeks}${labels.w}`
    return `${pluralLabel(diffWeeks, labels.week[0], labels.week[1])}${suffix}`
  }

  if (diffDays < 365) {
    if (mode === "short") return `${diffMonths}${labels.mo}`
    return `${pluralLabel(diffMonths, labels.month[0], labels.month[1])}${suffix}`
  }

  if (mode === "short") return `${diffYears}${labels.y}`
  return `${pluralLabel(diffYears, labels.year[0], labels.year[1])}${suffix}`
}
