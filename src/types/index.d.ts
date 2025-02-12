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
  price_recommended: number
  price_per_major_unit: number
  major_unit: string
  discount: number
  image: string
  category: string
  category_2: string
  category_3: string
  created_at: string | null
  updated_at: string | null
}

export type ProductWithId = Product & { id: string }
