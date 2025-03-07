import { ProductFromSupermarket } from "@/types"

import { SupermarketProductCard } from "./SupermarketProductCard"

export function ProductCard({ product }: { product: ProductFromSupermarket }) {
  return <SupermarketProductCard sp={product.supermarket_products[0]} />
}
