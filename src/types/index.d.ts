export type NavigationItem = {
  name: string
  href: string
  isNew?: boolean
}

export interface Product {
  url: string
  name: string
  brand: string
  pack: string
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
}

export type ProductWithId = Product & { id: string }

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}
