"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { ProductLinked } from "@/types"
import { FrontendStatus } from "@/types/extra"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"
import { SkeletonStatusError, SkeletonStatusLoaded, SkeletonStatusLoading } from "@/components/ui/combo/Loading"

import { BookHeartIcon, ShoppingBasketIcon } from "lucide-react"

export function TrackedProducts() {
  const [status, setStatus] = useState(FrontendStatus.Loading)
  const [essentialProducts, setEssentialProducts] = useState<ProductLinked[]>([])
  const [nonEssentialProducts, setNonEssentialProducts] = useState<ProductLinked[]>([])

  const isLoading = status === FrontendStatus.Loading

  async function fetchProducts() {
    setStatus(FrontendStatus.Loading)
    try {
      const essentialRes = await axios.get("/api/products/tracked?type=essential")
      setEssentialProducts(essentialRes.data.data || [])

      const nonEssentialRes = await axios.get("/api/products/tracked?type=non-essential")
      setNonEssentialProducts(nonEssentialRes.data.data || [])
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

  if (essentialProducts.length === 0 && nonEssentialProducts.length === 0 && status === FrontendStatus.Loaded) {
    return (
      <SkeletonStatusLoaded>
        <p>No products found. Check back soon!</p>
      </SkeletonStatusLoaded>
    )
  }

  return (
    <div className="flex w-full flex-col gap-y-16">
      <ProductsSection
        title="Essential"
        icon={<ShoppingBasketIcon className="size-5" />}
        description="Products often found in trustworthy inflation baskets, forever valuable for most people"
        products={essentialProducts.sort((a, b) => a.name.localeCompare(b.name))}
      />
      <ProductsSection
        title="Other tracked products"
        description="Handpicked by the team, very biased towards our own preferences"
        icon={<BookHeartIcon className="size-5" />}
        products={nonEssentialProducts.sort((a, b) => {
          if (a.id !== undefined && b.id !== undefined) return a.id - b.id
          return a.name.localeCompare(b.name)
        })}
      />
    </div>
  )
}

function ProductsSection({
  title,
  description,
  icon,
  products,
}: {
  title: React.ReactNode
  description?: string
  icon?: React.ReactNode
  products: ProductLinked[]
}) {
  return (
    <section className="flex flex-col">
      <div className="mb-6 border-b pb-2">
        <h2 className="inline-flex items-center gap-2 text-2xl font-bold">
          {title}
          {icon}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
        {products.map((product, productIdx) => (
          <ProductCard key={`product-${productIdx}`} product={product} />
        ))}
      </div>
    </section>
  )
}
