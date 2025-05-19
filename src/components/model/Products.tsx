"use client"

import { useState } from "react"
import { ProductLinked } from "@/types"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"

import { BookHeartIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProducts } from "@/hooks/useProducts"

export function Products() {
  const limit = 30
  const [page, setPage] = useState(1)
  const { data: products, isLoading } = useProducts({ offset: (page - 1) * limit })

  return (
    <div className="flex w-full flex-col gap-y-16">
      {isLoading ? (
        <ProductsSectionSkeleton />
      ) : (
        products &&
        products.length > 0 && (
          <ProductsSection
            title="Tracked products"
            icon={<ShoppingBasketIcon className="size-5" />}
            description="Products often found in trustworthy inflation baskets, forever valuable for most people"
            products={products}
          />
        )
      )}
    </div>
  )
}

function ProductsSection({
  title,
  description,
  icon,
  products,
  className,
}: {
  title: React.ReactNode
  products: ProductLinked[]
  icon?: React.ReactNode
  className?: string
  description?: string
}) {
  return (
    <section className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {description && <p className="mb-4 text-xs text-muted-foreground">{description}</p>}

      <div className={cn("rounded-lg border p-3 lg:p-4", className)}>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6 xl:gap-4">
          {products.map((product, productIdx) => (
            <ProductCard key={`product-${productIdx}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductsSectionSkeleton() {
  return (
    <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <ProductCardSkeleton key={`product-skeleton-${index}`} />
      ))}
    </div>
  )
}
