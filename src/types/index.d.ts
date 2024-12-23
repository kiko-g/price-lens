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
  priceRecommended: number
  pricePerMajorUnit: number
  majorUnit: string
  discount: number
  image: string
  category: string
  subCategory: string
  innerCategory: string
}
