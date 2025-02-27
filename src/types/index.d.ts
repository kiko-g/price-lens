import { PageStatus } from "./extra"

// UI types
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
  product_ref_ids: string[]
}

export interface SupermarketProduct {
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
}

export interface ProductFromSupermarket extends Product {
  supermarket_product: SupermarketProduct
}

export interface Price {
  id?: number
  product_id: number
  supermarket_id: number | null
  price: number | null
  price_recommended: number | null
  price_per_major_unit: number | null
  discount: number | null
  valid_from: string | null
  valid_to: string | null
  created_at: string | null
}

// Frontend types extended from database types
export interface ProductFrontend extends Product {
  status: PageStatus
}
