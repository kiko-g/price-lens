import { StaticImageData } from "next/image"

export interface BasketProduct {
  name_en: string
  name_pt: string
  quantity: string
  category: BasketProductCategory
  image?: StaticImageData
}

export type BasketProductCategory = "meat" | "seafood" | "vegetables" | "fruits" | "dairy" | "grocery" | "other"

export const BasketCategoryLabels: Record<BasketProductCategory, { en: string; pt: string }> = {
  meat: { en: "Meat & Poultry", pt: "Carne & Aves" },
  seafood: { en: "Seafood", pt: "Peixe & Marisco" },
  vegetables: { en: "Vegetables", pt: "Legumes" },
  fruits: { en: "Fruits", pt: "Frutas" },
  dairy: { en: "Dairy and Eggs", pt: "Laticínios e Ovos" },
  grocery: { en: "Grocery", pt: "Mercearia" },
  other: { en: "Other", pt: "Outros" },
}

export interface ProductChartEntry {
  date: string
  price: number
  "price-recommended": number
  "price-per-major-unit": number
  discount: number
}

export interface NavigationItem {
  href: string
  label: string
  shown?: boolean
  icon?: React.ElementType
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Database types
export interface Supermarket {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  brand: string | null
  category: string | null
  is_generic: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithListings extends Product {
  store_products: StoreProduct[]
}

export type PrioritySource = "ai" | "manual"

export interface StoreProduct {
  id: number
  origin_id: number
  url: string
  name: string
  brand: string | null
  barcode: string | null
  pack: string | null
  price: number
  price_recommended: number | null
  price_per_major_unit: number | null
  major_unit: string | null
  discount: number | null
  image: string | null
  category: string | null
  category_2: string | null
  category_3: string | null
  priority: number | null
  priority_updated_at: string | null
  priority_source: PrioritySource | null
  product_id: number | null
  created_at: string
  updated_at: string
  is_favorited?: boolean
}

export interface StoreProductWithSimilarity extends StoreProduct {
  similarity_score: number
  similarity_factors: string[]
}

export interface Price {
  id?: number
  store_product_id: number | null
  price: number | null
  price_recommended: number | null
  price_per_major_unit: number | null
  discount: number | null
  valid_from: string | null
  valid_to: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PricePoint {
  price: number
  price_recommended: number
  price_per_major_unit: number
  discount: number
  frequencyRatio: number
  averageDurationDays: number
  totalDuration: number
  occurrences: number
}

export interface PriceAnalytics {
  pricePoints: PricePoint[] | null
  mostCommon: PricePoint | null
  floor: number
  ceiling: number
  variations: {
    price: number
    priceRecommended: number
    pricePerMajorUnit: number
    discount: number
  }
  dateRange: {
    minDate: string | null
    maxDate: string | null
    daysBetween: number
  }
}

export interface PricesWithAnalytics {
  prices: Price[]
  analytics: PriceAnalytics
}

export interface UserFavorite {
  id: number
  user_id: string
  store_product_id: number
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  plan: "free" | "plus"
  role: "user" | "admin"
  updated_at: string | null
}
