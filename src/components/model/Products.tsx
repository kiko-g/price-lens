"use client"

import { useEffect, useState } from "react"
import { ProductLinked } from "@/types"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"

import { Loader2Icon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProducts } from "@/hooks/useProducts"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function Products() {
  const limit = 30
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { data: products, isLoading } = useProducts({ offset: (page - 1) * limit, q: debouncedQuery })

  useEffect(() => {
    if (query.length === 0) {
      setDebouncedQuery("")
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [query])

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-y-16">
        <div className="mb-3 grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 xl:gap-4 2xl:grid-cols-6 2xl:gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProductCardSkeleton key={`product-skeleton-${index}`} />
          ))}
        </div>
      </div>
    )
  }

  if (!products || products.length === 0)
    return (
      <div className="flex w-full flex-col gap-y-16">
        <p>No products found matching your search.</p>
      </div>
    )

  return (
    <div className="flex w-full flex-col gap-y-16">
      <section className="flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          <ShoppingBasketIcon className="size-5" />
          <h2 className="text-lg font-bold">Tracked products</h2>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Products often found in trustworthy inflation baskets, forever valuable for most people
        </p>

        <div className="flex flex-col gap-4">
          <div className="relative flex items-center gap-2">
            <div className="relative w-full">
              {isSearching ? (
                <Loader2Icon className="absolute left-2 top-1/4 h-4 w-4 -translate-y-1/4 animate-spin text-muted-foreground" />
              ) : (
                <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-8"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  if (typeof value === "string") setQuery(value)
                }}
              />
            </div>
          </div>

          <div className={cn("rounded-lg border p-3 lg:p-4")}>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5 xl:gap-4 2xl:grid-cols-6 2xl:gap-3">
              {products.map((product, productIdx) => (
                <ProductCard key={`product-${productIdx}`} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
