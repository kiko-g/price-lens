"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { StoreProduct } from "@/types"
import type { TrackedProductsResult } from "@/app/tracked/actions"

import { ProductCardSkeleton, StoreProductCard } from "@/components/model/StoreProductCard"
import { useSearchWithDebounce } from "@/hooks/useSearchWithDebounce"

import { ArrowUpIcon, Loader2Icon, SearchIcon, ShoppingBasketIcon, RefreshCwIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"

interface StoreProductsTrackedProps {
  initialData: TrackedProductsResult
  initialQuery: string
  initialOriginId: number
  initialPage: number
}

async function fetchProducts({
  page,
  query,
  originId,
}: {
  page: number
  query: string
  originId: number
}): Promise<TrackedProductsResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "30",
    tracked: "true",
    ...(query && { query }),
    ...(originId !== 0 && { originId: originId.toString() }),
  })

  const response = await fetch(`/api/products/store?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }

  const data = await response.json()

  return {
    products: data.data || [],
    pagination: {
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || 30,
      totalCount: data.pagination?.pagedCount || 0,
      totalPages: data.pagination?.totalPages || 0,
      hasMore: page < (data.pagination?.totalPages || 0),
    },
  }
}

export function StoreProductsTracked({
  initialData,
  initialQuery,
  initialOriginId,
  initialPage,
}: StoreProductsTrackedProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // State for products and pagination
  const [products, setProducts] = useState<StoreProduct[]>(initialData.products)
  const [pagination, setPagination] = useState(initialData.pagination)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // State for filters
  const [originId, setOriginId] = useState(initialOriginId)

  // Search state with debouncing
  const { query, debouncedQuery, isSearching, setIsSearching, handleQueryChange } = useSearchWithDebounce({
    delay: 300,
    minLength: 3,
    initialValue: initialQuery,
  })

  // Update URL with new search params
  const updateSearchParams = useCallback(
    (updates: { q?: string; origin?: number; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.q !== undefined) {
        if (updates.q) params.set("q", updates.q)
        else params.delete("q")
      }

      if (updates.origin !== undefined) {
        if (updates.origin !== 0) params.set("origin", updates.origin.toString())
        else params.delete("origin")
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) params.set("page", updates.page.toString())
        else params.delete("page")
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Handle origin change
  const handleOriginChange = (value: string) => {
    const newOriginId = Number(value)
    setOriginId(newOriginId)

    // Reset to page 1 when changing origin
    startTransition(() => {
      updateSearchParams({ origin: newOriginId, page: 1 })
    })
  }

  // Load more products
  const loadMore = async () => {
    if (!pagination.hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    const nextPage = pagination.page + 1

    try {
      const result = await fetchProducts({
        page: nextPage,
        query: debouncedQuery,
        originId,
      })

      setProducts((prev) => [...prev, ...result.products])
      setPagination(result.pagination)

      // Update URL to reflect new page
      updateSearchParams({ page: nextPage })
    } catch (error) {
      console.error("Failed to load more products:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Prefetch next page on hover for better perceived performance
  const prefetchNextPage = () => {
    if (!pagination.hasMore || isLoadingMore) return

    const nextPage = pagination.page + 1
    // Prefetch the data but don't await or update state
    fetchProducts({
      page: nextPage,
      query: debouncedQuery,
      originId,
    }).catch(() => {
      // Silently fail prefetch
    })
  }

  // Fetch products when filters change
  useEffect(() => {
    if (debouncedQuery === initialQuery && originId === initialOriginId && pagination.page === initialPage) {
      return // Skip if nothing changed
    }

    const fetchData = async () => {
      setIsSearching(true)

      try {
        const result = await fetchProducts({
          page: 1, // Reset to page 1 on filter change
          query: debouncedQuery,
          originId,
        })

        startTransition(() => {
          setProducts(result.products)
          setPagination(result.pagination)
          updateSearchParams({ q: debouncedQuery, origin: originId, page: 1 })
        })
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsSearching(false)
      }
    }

    fetchData()
  }, [debouncedQuery, originId]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isLoading = isPending || isSearching

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

          <div className="mt-2 flex flex-col gap-2">
            {isLoading ? (
              <Skeleton className="h-4 w-full rounded-md" />
            ) : (
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{pagination.totalCount}</strong> products found
                {debouncedQuery && ` matching "${debouncedQuery}"`}
              </p>
            )}

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
          {isLoading && products.length === 0 ? (
            <div className="flex w-full flex-col gap-y-16">
              <div className="grid w-full grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 30 }).map((_, index) => (
                  <ProductCardSkeleton key={`product-skeleton-${index}`} />
                ))}
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid w-full grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-5 xl:grid-cols-6">
                {products.map((sp, spIdx) => (
                  <StoreProductCard key={`${sp.id}-${spIdx}`} sp={sp} />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-4 border-t pt-4">
                <p className="text-muted-foreground text-center text-sm">
                  Showing <strong className="text-foreground">{products.length}</strong> of{" "}
                  <strong className="text-foreground">{pagination.totalCount}</strong> products
                </p>

                <div className="flex gap-2">
                  {pagination.hasMore && (
                    <Button
                      onClick={loadMore}
                      onMouseEnter={prefetchNextPage}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="sm"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2Icon className="mr-2 size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCwIcon className="mr-2 size-4" />
                          Load More
                        </>
                      )}
                    </Button>
                  )}

                  {products.length > 30 && (
                    <Button size="sm" variant="outline" onClick={scrollToTop}>
                      Back to top <ArrowUpIcon className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBasketIcon className="text-muted-foreground mb-4 size-12" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-muted-foreground text-sm">
                {debouncedQuery ? `No products matching "${debouncedQuery}"` : "No tracked products available"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
