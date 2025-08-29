"use client"

import { useEffect, useState, useRef } from "react"
import { ProductWithListings } from "@/types"

import { ProductCard } from "@/components/model/ProductCard"
import { ProductCardSkeleton } from "@/components/model/StoreProductCard"

import { ArrowUpIcon, Loader2Icon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProducts } from "@/hooks/useProducts"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"

export function Products() {
  const limit = 25
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [accumulatedProducts, setAccumulatedProducts] = useState<ProductWithListings[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [selectedOrigin, setSelectedOrigin] = useState<number>(0)

  const loadingRef = useRef(false)

  const { data: products, isLoading } = useProducts({
    offset: (page - 1) * limit,
    limit,
    q: debouncedQuery,
    origin: selectedOrigin,
  })

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
      setPage(1)
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
      <section className="relative flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left side - sticky on desktop */}
        <aside className="flex h-full flex-1 flex-col lg:sticky lg:top-[calc(54px+1rem)] lg:h-fit lg:w-1/5">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBasketIcon className="size-5" />
            <h2 className="text-lg font-bold">Tracked products</h2>
          </div>

          <p className="text-muted-foreground mb-4 text-xs">
            Products often found in trustworthy inflation baskets, forever valuable for most people
          </p>

          <div className="relative w-full">
            {isSearching ? (
              <Loader2Icon className="text-muted-foreground absolute top-1/4 left-2 h-4 w-4 -translate-y-1/4 animate-spin" />
            ) : (
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
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

          <div className="mt-1.5 flex flex-col gap-2">
            {isLoading ? (
              <Skeleton className="h-4 w-full rounded-md" />
            ) : (
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{accumulatedProducts.length}</strong> products found matching your
                search
              </p>
            )}

            {/* TODO: */}
            <div className="flex flex-col gap-2 border-t pt-2">
              <h3 className="text-foreground text-sm font-medium">Store Origin</h3>
              <RadioGroup value={selectedOrigin.toString()} onValueChange={(value) => setSelectedOrigin(Number(value))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="all-stores" />
                  <Label
                    htmlFor="all-stores"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    All stores
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="continente" />
                  <Label
                    htmlFor="continente"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <ContinenteSvg className="h-4 min-h-4 w-auto" />
                    <span className="sr-only">Continente</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="auchan" />
                  <Label
                    htmlFor="auchan"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <AuchanSvg className="h-4 min-h-4 w-auto" />
                    <span className="sr-only">Auchan</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="pingo-doce" />
                  <Label
                    htmlFor="pingo-doce"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <PingoDoceSvg className="h-4 min-h-4 w-auto" />
                    <span className="sr-only">Pingo Doce</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </aside>

        {/* Right side - scrollable */}
        <div className={cn("flex w-full flex-col lg:w-4/5")}>
          {isLoading && page === 1 ? (
            <div className="flex w-full flex-col gap-y-16">
              <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-6 xl:gap-4">
                {Array.from({ length: limit }).map((_, index) => (
                  <ProductCardSkeleton key={`product-skeleton-${index}`} />
                ))}
              </div>
            </div>
          ) : accumulatedProducts.length > 0 ? (
            <>
              <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-6 xl:gap-4">
                {accumulatedProducts.map((product, productIdx) => (
                  <ProductCard key={`product-${productIdx}`} product={product} />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start gap-2 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground text-center text-sm">
                  Showing <strong className="text-foreground">{accumulatedProducts.length}</strong> products in total
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Back to top <ArrowUpIcon className="size-4" />
                </Button>
              </div>

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
      </section>
    </div>
  )
}
