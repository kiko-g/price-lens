import { ProductLinked } from "@/types"

import { StoreProductCard } from "./StoreProductCard"

export function ProductCard({ product }: { product: ProductLinked }) {
  return <StoreProductCard sp={product.store_products[0]} />
}
