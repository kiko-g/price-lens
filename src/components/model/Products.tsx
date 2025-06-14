"use client"

import { useEffect, useState, useRef } from "react"
import { ProductLinked } from "@/types"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"

import { FilterIcon, Loader2Icon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProducts } from "@/hooks/useProducts"

import { Input } from "@/components/ui/input"

export function Products() {
  const limit = 24
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [accumulatedProducts, setAccumulatedProducts] = useState<ProductLinked[]>([])
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)

  const { data: products, isLoading } = useProducts({ offset: (page - 1) * limit, limit, q: debouncedQuery })

  useEffect(() => {
    if (!products) return

    setAccumulatedProducts((prev) => {
      const isFirstPageOrSearch = page === 1 || debouncedQuery !== ""
      return isFirstPageOrSearch ? products : [...prev, ...products]
    })

    setHasMore(products.length === limit)
    loadingRef.current = false
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

  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMore || isLoading) return

      const scrolledToBottom =
        window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 100

      if (scrolledToBottom) {
        loadingRef.current = true
        setPage((prev) => prev + 1)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, isLoading])

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
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {accumulatedProducts.length} products found matching your search.
                </p>
                {isLoading && (
                  <div className="mt-8 flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <p>No products found matching your search.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
