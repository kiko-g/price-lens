"use client"

import { useEffect, useState } from "react"
import { ProductLinked } from "@/types"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"

import { FilterIcon, Loader2Icon, PlusIcon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProducts } from "@/hooks/useProducts"

import { Input } from "@/components/ui/input"
import { Button } from "../ui/button"

export function Products() {
  const limit = 36
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [accumulatedProducts, setAccumulatedProducts] = useState<ProductLinked[]>([])

  const { data: products, isLoading } = useProducts({ offset: (page - 1) * limit, q: debouncedQuery })

  useEffect(() => {
    if (!products) return

    setAccumulatedProducts((prev) => {
      const isFirstPageOrSearch = page === 1 || debouncedQuery !== ""
      return isFirstPageOrSearch ? products : [...prev, ...products]
    })
  }, [products, page, debouncedQuery])

  useEffect(() => {
    if (query.length === 0 || query.length < 3) {
      setDebouncedQuery("")
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1) // Reset page when search query changes
      setIsSearching(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [query])

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

          <div className={cn("mb-4 flex flex-col")}>
            {isLoading && page === 1 ? (
              <div className="flex w-full flex-col gap-y-16">
                <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6 xl:gap-4 2xl:grid-cols-6 2xl:gap-4">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <ProductCardSkeleton key={`product-skeleton-${index}`} />
                  ))}
                </div>
              </div>
            ) : accumulatedProducts.length > 0 ? (
              <>
                <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6 xl:gap-4 2xl:grid-cols-6 2xl:gap-4">
                  {accumulatedProducts.map((product, productIdx) => (
                    <ProductCard key={`product-${productIdx}`} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <p>No products found matching your search.</p>
            )}

            {products && products.length === limit && !isLoading && (
              <div className="mt-8 flex items-center justify-center">
                <Button variant="outline" onClick={() => setPage(page + 1)}>
                  {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                  Load more products
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
