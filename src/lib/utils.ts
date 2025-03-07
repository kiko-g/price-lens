import type { Price, ProductChartEntry, SupermarketProduct } from "@/types"
import type { DateRange } from "@/types/extra"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const imagePlaceholder = {
  productBlur:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwPDY2ODYyTEhHSkhGSUxQWlNgYFtVWV1KV2JhboN8f5rCxrL/2wBDARUXFyAeIBogHB4iIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
}

export const mockChartData: ProductChartEntry[] = [
  { date: "January", price: 4.99, "price-recommended": 5.99, discount: 17, "price-per-major-unit": 9.99 },
  { date: "February", price: 5.49, "price-recommended": 5.99, discount: 8, "price-per-major-unit": 10.98 },
  { date: "March", price: 5.99, "price-recommended": 6.49, discount: 8, "price-per-major-unit": 11.98 },
  { date: "April", price: 5.49, "price-recommended": 6.49, discount: 15, "price-per-major-unit": 10.98 },
  { date: "May", price: 4.99, "price-recommended": 6.49, discount: 23, "price-per-major-unit": 9.99 },
  { date: "June", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "July", price: 6.49, "price-recommended": 6.99, discount: 7, "price-per-major-unit": 12.98 },
  { date: "August", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "September", price: 5.49, "price-recommended": 6.49, discount: 15, "price-per-major-unit": 10.98 },
  { date: "October", price: 4.99, "price-recommended": 6.49, discount: 23, "price-per-major-unit": 9.99 },
  { date: "November", price: 5.99, "price-recommended": 6.99, discount: 14, "price-per-major-unit": 11.98 },
  { date: "December", price: 6.49, "price-recommended": 6.99, discount: 7, "price-per-major-unit": 16.0 },
]

export const productUnavailable: SupermarketProduct = {
  url: "",
  name: "Unavailable",
  brand: "",
  pack: "",
  price: 0,
  price_recommended: 0,
  price_per_major_unit: 0,
  major_unit: "",
  discount: 0,
  image: "",
  category: "",
  category_2: "",
  category_3: "",
  created_at: null,
  updated_at: null,
  origin_id: 1,
  is_tracked: false,
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
  // Helper to parse date strings into UTC dates at midnight
  const parseUTCDate = (dateStr: string): Date => {
    const date = new Date(dateStr)
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  // Filter out prices without valid_from and sort them by valid_from
  const validPrices = prices.filter((p) => p.valid_from !== null)
  if (validPrices.length === 0) {
    return []
  }
  validPrices.sort((a, b) => a.valid_from!.localeCompare(b.valid_from!))

  // Preprocess prices into objects with UTC Date instances
  type ProcessedPrice = {
    validFrom: Date
    validTo: Date | null
    price: number | null
    price_recommended: number | null
    price_per_major_unit: number | null
    discount: number | null
  }

  const processedPrices: ProcessedPrice[] = validPrices.map((p) => {
    const validFrom = parseUTCDate(p.valid_from!)
    const validTo = p.valid_to ? parseUTCDate(p.valid_to) : null
    return {
      validFrom,
      validTo,
      price: p.price,
      price_recommended: p.price_recommended,
      price_per_major_unit: p.price_per_major_unit,
      discount: p.discount,
    }
  })

  // Adjust validTo dates to avoid overlaps and gaps (using UTC)
  for (let i = 0; i < processedPrices.length - 1; i++) {
    const current = processedPrices[i]
    const next = processedPrices[i + 1]
    const adjustedValidTo = new Date(next.validFrom)
    adjustedValidTo.setUTCDate(adjustedValidTo.getUTCDate() - 1) // Previous day in UTC

    if (current.validTo === null || current.validTo > adjustedValidTo) {
      current.validTo = adjustedValidTo
    }
  }

  // Determine start and end dates based on the range (UTC)
  const getStartEndDates = (range: DateRange): { start: Date; end: Date } => {
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    if (range === "Max") {
      const earliest = processedPrices[0].validFrom
      const latestPrice = processedPrices[processedPrices.length - 1]
      const endDate = latestPrice.validTo || todayUTC
      return { start: earliest, end: endDate }
    } else {
      const endDate = todayUTC
      const startDate = new Date(endDate)

      switch (range) {
        case "1W":
          startDate.setUTCDate(endDate.getUTCDate() - 7)
          break
        case "1M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 1)
          break
        case "3M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 3)
          break
        case "6M":
          startDate.setUTCMonth(endDate.getUTCMonth() - 6)
          break
        case "1Y":
          startDate.setUTCFullYear(endDate.getUTCFullYear() - 1)
          break
        case "5Y":
          startDate.setUTCFullYear(endDate.getUTCFullYear() - 5)
          break
        default:
          throw new Error(`Unsupported range: ${range}`)
      }
      return { start: startDate, end: endDate }
    }
  }

  const { start, end } = getStartEndDates(range)

  // Generate all UTC dates from start to end, inclusive at midnight UTC
  const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = []
    const current = new Date(startDate)
    current.setUTCHours(0, 0, 0, 0)
    const endUTC = new Date(endDate)
    endUTC.setUTCHours(0, 0, 0, 0)

    while (current <= endUTC) {
      dates.push(new Date(current))
      current.setUTCDate(current.getUTCDate() + 1)
    }
    return dates
  }

  const dates = generateDateRange(start, end)

  // Create the chart entries by mapping each date to its applicable price
  const entries: ProductChartEntry[] = []
  let currentPriceIndex = 0

  for (const date of dates) {
    const dateStr = date.toISOString().split("T")[0]

    while (currentPriceIndex < processedPrices.length) {
      const price = processedPrices[currentPriceIndex]
      if (date < price.validFrom) {
        break // No price applies yet
      }

      if (price.validTo !== null && date > price.validTo) {
        currentPriceIndex++
      } else {
        entries.push({
          date: dateStr,
          price: price.price ?? 0,
          "price-recommended": price.price_recommended ?? 0,
          "price-per-major-unit": price.price_per_major_unit ?? 0,
          discount: price.discount ? price.discount * 100 : 0,
        })
        break
      }
    }
  }

  return entries
}

function formatDate(dateString: string, range: DateRange = "1M"): string {
  const date = new Date(dateString)

  switch (range) {
    case "3M":
    case "6M":
    case "1Y":
    case "5Y":
    case "Max":
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })

    case "1W":
    case "1M":
    default:
      return date.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
      })
  }
}
