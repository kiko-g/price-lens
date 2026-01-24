import type { Price, StoreProduct, ProductChartEntry } from "@/types"

// Showcase carousel types
export type ShowcaseTrendStats = {
  percent: number
  direction: "up" | "down" | "stable"
  period: string
}

export type ShowcaseProduct = {
  storeProduct: StoreProduct
  prices: Price[]
  chartData: ProductChartEntry[]
  trendStats: ShowcaseTrendStats
}

export type ShowcaseData = Record<string, ShowcaseProduct>

// Showcase product IDs for the home page carousel
export const SHOWCASE_PRODUCT_IDS = [
  "18543", // buondi (continente)
  "4893", // m&ms (continente)
  "3519", // ben and jerry (continente)
  "2558", // leite uht meio gordo mimosa (continente)
  "16258", // monster white (continente)
  "3807", // atum lata (continente)
  "18728", // cereais fitness (continente)
]
