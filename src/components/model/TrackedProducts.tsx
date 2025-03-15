"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { ProductFromSupermarket } from "@/types"
import { FrontendStatus } from "@/types/extra"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/SupermarketProductCard"
import { SkeletonStatusError, SkeletonStatusLoaded, SkeletonStatusLoading } from "@/components/ui/combo/Loading"

export function TrackedProducts() {
  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [products, setProducts] = useState<ProductFromSupermarket[]>([])

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const { data } = await axios.get("/api/products/tracked")
      const products = data.data || []
      setProducts(products)
    } catch (err) {
      setStatus(FrontendStatus.Error)
      console.error("Failed to fetch products:", err)
    } finally {
      setStatus(FrontendStatus.Loaded)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (status === FrontendStatus.Error) {
    return (
      <SkeletonStatusError>
        <p>Error fetching products. Please try again.</p>
      </SkeletonStatusError>
    )
  }

  if (isLoading) {
    return (
      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <ProductCardSkeleton key={`product-skeleton-${index}`} />
        ))}
      </div>
    )
  }

  if (products.length === 0 && status === FrontendStatus.Loaded) {
    return (
      <SkeletonStatusLoaded>
        <p>No products found. Check back soon!</p>
      </SkeletonStatusLoaded>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product, productIdx) => (
          <ProductCard key={`product-${productIdx}`} product={product} />
        ))}
      </div>
    </div>
  )
}
