export type NavigationItem = {
  name: string
  href: string
  isNew?: boolean
}

export type Product = {
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
  sub_category: string
  inner_category: string
  created_at?: string
  updated_at?: string
}
