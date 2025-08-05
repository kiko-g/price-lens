"use client"

import { useState } from "react"
import { StoreProduct } from "@/types"

import { ProductCardSkeleton, StoreProductCard } from "@/components/model/StoreProductCard"
import { useSearchWithDebounce } from "@/hooks/useSearchWithDebounce"
import { useInfiniteStoreProducts } from "@/hooks/useInfiniteStoreProducts"

import { ArrowUpIcon, Loader2Icon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"

export function StoreProductsTracked() {
  const [originId, setOriginId] = useState<number>(0)

  const { query, debouncedQuery, isSearching, setIsSearching, handleQueryChange, clearSearch } = useSearchWithDebounce({
    delay: 300,
    minLength: 3,
  })

  const {
    products: accumulated,
    isLoading,
    page,
    scrollToTop,
  } = useInfiniteStoreProducts({
    limit: 30,
    tracked: true,
    query: debouncedQuery,
    originId,
  })

  // Clear search when changing origin
  const handleOriginChange = (value: string) => {
    clearSearch()
    setOriginId(Number(value))
  }

  // Handle search completion - turn off searching when results arrive
  if (isSearching && !isLoading && debouncedQuery) {
    setIsSearching(false)
  }

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
              <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 animate-spin" />
            ) : (
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
            )}
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-8"
              value={query}
              onChange={handleQueryChange}
            />
          </div>

          <div className="mt-1.5 flex flex-col gap-2">
            {isLoading ? (
              <Skeleton className="h-4 w-full rounded-md" />
            ) : (
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{accumulated.length}</strong> products found matching your search
              </p>
            )}

            {/* TODO: */}
            <div className="flex flex-col gap-2 border-t pt-2">
              <h3 className="text-foreground text-sm font-medium">Store Origin</h3>
              <RadioGroup value={originId.toString()} onValueChange={handleOriginChange}>
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
              <div className="grid w-full grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-5">
                {Array.from({ length: 30 }).map((_, index) => (
                  <ProductCardSkeleton key={`product-skeleton-${index}`} />
                ))}
              </div>
            </div>
          ) : accumulated.length > 0 ? (
            <>
              <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {accumulated.map((sp, spIdx) => (
                  <StoreProductCard key={`product-${spIdx}`} sp={sp} />
                ))}
              </div>

              {isLoading && (
                <div className="my-5 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 30 }).map((_, index) => (
                    <ProductCardSkeleton key={`product-skeleton-${index}`} />
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-col items-start gap-2 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground text-center text-sm">
                  Showing <strong className="text-foreground">{accumulated.length}</strong> products in total
                </p>
                <Button size="sm" variant="outline" className="cursor-pointer" onClick={scrollToTop}>
                  Back to top <ArrowUpIcon className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <p>No products found matching your search.</p>
          )}
        </div>
      </section>
    </div>
  )
}
