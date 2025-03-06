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

export function buildChartData(prices: Price[], minPoints = 5, maxPoints = 20): ProductChartEntry[] {
  if (!prices.length) return []

  const sortedPrices = [...prices].sort((a, b) => {
    if (!a.valid_from) return 1
    if (!b.valid_from) return -1
    return new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  })

  const validPrices = sortedPrices.filter((price) => price.valid_from !== null && price.price !== null)
  if (!validPrices.length) return []

  if (validPrices.length < minPoints) {
    const pricePoints: ProductChartEntry[] = []
    let startDate = new Date(validPrices[0].valid_from!)
    let endDate: Date
    if (validPrices.length === 1) {
      if (validPrices[0].updated_at) endDate = new Date(validPrices[0].updated_at)
      else endDate = new Date()
    } else {
      endDate = new Date(validPrices[validPrices.length - 1].valid_from!)
    }

    if (endDate.getTime() - startDate.getTime() < 86400000) {
      endDate = new Date(startDate.getTime() + 86400000 * 7)
    }

    const totalDuration = endDate.getTime() - startDate.getTime()
    const interval = totalDuration / (minPoints - 1)

    for (let i = 0; i < minPoints; i++) {
      const pointDate = new Date(startDate.getTime() + interval * i)
      const validPrice =
        validPrices.find((price) => {
          const priceDate = new Date(price.valid_from!)
          const priceEndDate = price.valid_to ? new Date(price.valid_to) : endDate
          return priceDate <= pointDate && pointDate <= priceEndDate
        }) || validPrices[0]

      pricePoints.push({
        date: formatDate(pointDate.toISOString()),
        price: validPrice.price!,
        "price-recommended": validPrice.price_recommended || validPrice.price!,
        discount: validPrice.discount || 0,
        "price-per-major-unit": validPrice.price_per_major_unit || validPrice.price!,
      })
    }

    return pricePoints
  }

  if (validPrices.length > maxPoints) {
    const step = Math.ceil(validPrices.length / maxPoints)
    const sampledPrices = []
    sampledPrices.push(validPrices[0])

    for (let i = step; i < validPrices.length - 1; i += step) sampledPrices.push(validPrices[i])

    if (sampledPrices[sampledPrices.length - 1] !== validPrices[validPrices.length - 1]) {
      sampledPrices.push(validPrices[validPrices.length - 1])
    }

    validPrices.length = 0
    validPrices.push(...sampledPrices)
  }

  return validPrices.map((price) => ({
    date: formatDate(price.valid_from!),
    price: price.price!,
    "price-recommended": price.price_recommended || price.price!,
    discount: price.discount || 0,
    "price-per-major-unit": price.price_per_major_unit || price.price!,
  }))
}

function formatDate(dateString: string, range = "1M"): string {
  const date = new Date(dateString)

  switch (range) {
    case "1Y":
      return date.toLocaleString("en-US", {
        year: "numeric",
      })
    case "5Y":
      return date.toLocaleString("en-US", {
        year: "numeric",
      })
    case "Max":
      return date.toLocaleString("en-US", {
        year: "numeric",
      })
    default:
      return date.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
      })
  }
}
