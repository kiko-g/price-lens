import { ChartConfig } from "@/components/ui/chart"
import type { Price, ProductChartEntry, StoreProduct } from "@/types"
import type { DateRange } from "@/types/business"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a URL-safe slug from a store product
 * Format: {brand}-{name_shorthand}-{origin_id}
 */
export function generateProductSlug(product: {
  brand?: string | null
  name?: string | null
  origin_id?: number | null
}): string {
  const slugify = (text: string | null | undefined): string => {
    if (!text) return ""
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces to dashes
      .replace(/-+/g, "-") // multiple dashes to single
      .replace(/^-|-$/g, "") // trim leading/trailing dashes
  }

  const brand = slugify(product.brand)
  // Take first 4-5 meaningful words from name
  const nameParts = slugify(product.name)?.split("-").slice(0, 5).join("-") || ""
  const originId = product.origin_id ?? ""

  const parts = [brand, nameParts, originId].filter(Boolean)
  return parts.join("-") || "product"
}

/**
 * Generates a full product URL path with ID and slug
 * Format: /products/{id}-{slug}
 */
export function generateProductPath(product: StoreProduct): string {
  const slug = generateProductSlug(product)
  return `/products/${product.id}-${slug}`
}

/**
 * Extracts the numeric ID from a product URL segment
 * Handles both "/products/123" and "/products/123-coca-cola-1"
 */
export function extractProductIdFromSlug(slug: string): number | null {
  // Match digits at the start of the string
  const match = slug.match(/^(\d+)/)
  if (!match) return null
  const id = parseInt(match[1], 10)
  return isNaN(id) ? null : id
}

export function resizeImgSrc(src: string, width: number, height: number) {
  if (!src) return ""

  const updatedSrc = src.replace(/sw=\d+/g, `sw=${width}`).replace(/sh=\d+/g, `sh=${height}`)
  return updatedSrc
}

export function packageToUnit(pack: string) {
  return pack.replace("emb.", "").replace(/\s+/g, " ").trim()
}

export function priceToNumber(price: string) {
  if (typeof price === "number") return price
  return Number(price.replace(",", ".").replace(/[^0-9.-]+/g, "")) // assuming PT locale
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(price)
}

export function formatProductName(name: string | undefined) {
  if (!name) return ""
  return name.toUpperCase() === name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name
}

export function formatTimestamptz(timestamptz: string | null) {
  if (!timestamptz) return ""

  return new Date(timestamptz).toLocaleString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function discountValueToPercentage(discount: number) {
  return `${(Math.round(discount * 1000) / 10).toFixed(1)}%`
}

export function isValidJson(json: string) {
  try {
    JSON.parse(json)
    return true
  } catch (error) {
    console.warn(error)
    return false
  }
}

export function getCenteredArray(length: number, page: number, rightmostBoundary: number | null = null) {
  const halfLength = Math.floor(length / 2)
  let start = Math.max(1, page - halfLength)

  if (page <= halfLength) {
    start = 1 // near the start
  }

  if (rightmostBoundary && start + length > rightmostBoundary) {
    start = Math.max(1, rightmostBoundary - length + 1) // near the end
  }

  const array = Array.from({ length }, (_, i) => start + i)
  return array
}

export function now() {
  return new Date().toISOString().replace("Z", "+00:00")
}

export function buildChartData(prices: Price[], range: DateRange = "1M"): ProductChartEntry[] {
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

  const daysBetweenDates = getDaysBetweenDates(start, end)
  const entries: ProductChartEntry[] = []

  // Create one data point for each day in the range
  const current = new Date(start)
  let priceIndex = 0

  while (current <= end) {
    const dateStr = formatDateForChart(current.toISOString(), daysBetweenDates > 30 ? range : "1M")

    // Find the applicable price for this date
    while (priceIndex < processedPrices.length) {
      const price = processedPrices[priceIndex]
      if (current < price.validFrom) break

      if (price.validTo !== null && current > price.validTo) {
        priceIndex++
      } else {
        entries.push({
          date: dateStr,
          price: price.price ?? 0,
          "price-per-major-unit": price.price_per_major_unit ?? 0,
          "price-recommended": price.price_recommended ?? 0,
          discount: price.discount ? price.discount * 100 : 0,
        })
        break
      }
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return entries
}

// FIXME: review
function formatDateForChart(dateString: string, range: DateRange = "1M"): string {
  const date = new Date(dateString)

  switch (range) {
    case "3M":
    case "6M":
    case "1Y":
    case "5Y":
    case "Max":
      return date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
      })

    case "1W":
    case "2W":
    case "1M":
    default:
      return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
      })
  }
}

export function getDaysBetweenDates(startDate: Date, endDate: Date) {
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
}

export function elapsedMsToTimeStr(elapsedMs: number) {
  const hours = Math.floor(elapsedMs / 3600000)
  const minutes = Math.floor((elapsedMs % 3600000) / 60000)
  const seconds = Math.floor((elapsedMs % 60000) / 1000)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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
 * Get a short version of relative time for compact displays
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
  if (diffWeeks < 4) return `${diffWeeks}w`
  if (diffMonths === 1) return "1mo"
  if (diffMonths < 12) return `${diffMonths}mo`
  if (diffYears === 1) return "1y"
  return `${diffYears}y`
}
