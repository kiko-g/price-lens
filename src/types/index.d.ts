import { FrontendStatus } from "./extra"
import { StaticImageData } from "next/image"

// UI types
export type ProductQueryType = "all" | "essential" | "non-essential"

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
  id?: number
  name: string
  brand: string
  category: string
  essential: boolean
  product_ref_ids: string[]
}

export interface StoreProduct {
  id?: number
  url: string
  name: string
  brand: string
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
  created_at: string | null
  updated_at: string | null
  origin_id: number | null
  is_tracked: boolean
  is_essential: boolean
}

export interface ProductLinked extends Product {
  store_products: StoreProduct[]
}

export interface Price {
  id?: number
  product_id: number
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

// Frontend types extended from database types
export interface ProductFrontend extends Product {
  status: FrontendStatus
}
