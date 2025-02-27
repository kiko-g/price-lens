import { PageStatus } from "./extra"

export interface NavigationItem {
  href: string
  label: string
  shown?: boolean
  icon?: React.ElementType
}

export interface Product {
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

export interface ProductFrontend extends Product {
  status: PageStatus
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
