export type NavigationItem = {
  name: string
  href: string
  isNew?: boolean
}

export type Product = {
  name: string
  brand: string
  pack: string
  price: number
  priceRecommended: number
  pricePerMajorUnit: number
  majorUnit: string
  discount: number
  image: string
}
