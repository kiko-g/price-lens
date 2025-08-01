import { ProductWithListings } from "@/types"

import { StoreProductCard } from "./StoreProductCard"

export function ProductCard({ product }: { product: ProductWithListings }) {
  return <StoreProductCard sp={product.store_products[0]} />
}
