"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { TrackedProductsPage, PriorityFilterValue } from "@/hooks/useTrackedProducts"
import { useTrackedProducts } from "@/hooks/useTrackedProducts"
import { useSearchWithDebounce } from "@/hooks/useSearchWithDebounce"

import { ProductCardSkeleton, StoreProductCard } from "@/components/model/StoreProductCard"

import { ArrowUpIcon, Loader2Icon, SearchIcon, ShoppingBasketIcon, RefreshCwIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { ContinenteSvg, AuchanSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "./PriorityBubble"

interface StoreProductsTrackedProps {
  initialData: TrackedProductsPage
  initialQuery: string
}

// Parse array filters from URL
const parseArrayParam = (param: string | null): number[] => {
  if (!param) return []
  return param
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v))
}

const parsePriorityParam = (param: string | null): PriorityFilterValue[] => {
  if (!param) return []
  return param.split(",").map((v) => (v === "none" ? "none" : parseInt(v, 10)))
}

const serializeArray = (arr: (number | string)[]): string | null => {
  if (arr.length === 0) return null
  return arr.join(",")
}

export function StoreProductsTracked({ initialData, initialQuery }: StoreProductsTrackedProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Parse URL params
  const urlFilters = useMemo(() => {
    const originParam = searchParams.get("origin")
    const priorityParam = searchParams.get("priority")

    return {
      origin: parseArrayParam(originParam),
      query: searchParams.get("q") || "",
      priority: parsePriorityParam(priorityParam),
    }
  }, [searchParams])

  // Optimistic local state for instant UI feedback
  const [optimisticOrigin, setOptimisticOrigin] = useState<number[]>(urlFilters.origin)
  const [optimisticPriority, setOptimisticPriority] = useState(urlFilters.priority)

  // Sync optimistic state when URL changes (back/forward navigation)
  useEffect(() => {
    setOptimisticOrigin(urlFilters.origin)
  }, [urlFilters.origin])

  useEffect(() => {
    setOptimisticPriority(urlFilters.priority)
  }, [urlFilters.priority])

  // Use optimistic values for UI and queries
  const filters = useMemo(
    () => ({
      origin: optimisticOrigin,
      query: urlFilters.query,
      priority: optimisticPriority,
    }),
    [optimisticOrigin, optimisticPriority, urlFilters.query],
  )

  // Search input with debouncing (needs local state for immediate feedback)
  const {
    query: inputQuery,
    debouncedQuery,
    isSearching,
    handleQueryChange,
  } = useSearchWithDebounce({
    delay: 300,
    minLength: 3,
    initialValue: initialQuery,
  })

  // React Query hook for tracked products
  const {
    products,
    pagination,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    prefetchNextPage,
  } = useTrackedProducts({
    query: debouncedQuery,
    origin: filters.origin,
    priority: filters.priority,
    initialData,
  })

  // Update URL with new search params
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === 0) {
          params.delete(key)
        } else {
          params.set(key, value.toString())
        }
      })

      // Reset page when filters change
      params.delete("page")

      // Replace encoded commas with actual commas for readability
      const queryString = params.toString().replace(/%2C/g, ",")
      router.push(`${pathname}?${queryString}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Sync debounced query to URL
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      updateSearchParams({ q: debouncedQuery || null })
    }
  }, [debouncedQuery, filters.query, updateSearchParams])

  // Handle origin toggle - multi-select with optimistic update
  const handleOriginToggle = (value: number) => {
    console.debug("[handleOriginToggle] clicked:", value, "current:", optimisticOrigin)
    const isSelected = optimisticOrigin.includes(value)
    const updated = isSelected ? optimisticOrigin.filter((v) => v !== value) : [...optimisticOrigin, value]
    console.debug("[handleOriginToggle] updated:", updated)
    setOptimisticOrigin(updated)
    startTransition(() => {
      updateSearchParams({ origin: serializeArray(updated) })
    })
  }

  const clearOriginFilters = () => {
    setOptimisticOrigin([])
    startTransition(() => {
      updateSearchParams({ origin: null })
    })
  }

  const isOriginSelected = (value: number) => optimisticOrigin.includes(value)

  // Handle priority toggle - optimistic update then sync URL
  const handlePriorityToggle = (value: PriorityFilterValue) => {
    const isSelected = optimisticPriority.includes(value)
    const updated = isSelected ? optimisticPriority.filter((v) => v !== value) : [...optimisticPriority, value]
    setOptimisticPriority(updated)
    startTransition(() => {
      updateSearchParams({ priority: serializeArray(updated) })
    })
  }

  const clearPriorityFilters = () => {
    setOptimisticPriority([])
    startTransition(() => {
      updateSearchParams({ priority: null })
    })
  }

  const isPrioritySelected = (value: PriorityFilterValue) => optimisticPriority.includes(value)

  // Load more handler
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Show loading when initially loading, searching, or refetching due to filter changes
  const isRefetching = isFetching && !isFetchingNextPage
  const showLoading = isLoading || isSearching || isRefetching

  return (
    <div className="flex w-full flex-col gap-y-16">
      <section className="relative flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left side - sticky on desktop */}
        <aside className="flex h-full flex-1 flex-col lg:sticky lg:top-[calc(54px+1rem)] lg:h-fit lg:w-1/5">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBasketIcon className="size-5" />
            <h2 className="text-lg font-bold">Tracked products</h2>
          </div>

          <p className="mb-4 text-sm">
            Priority affects how often the prices are updated. Any favorited product by any user will be assigned a
            priority of 4 right away.
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
              className="pl-8 text-base md:text-sm"
              value={inputQuery}
              onChange={handleQueryChange}
            />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {showLoading ? (
              <Skeleton className="h-4 w-full rounded-md" />
            ) : (
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{pagination.totalCount}</strong> products found
                {debouncedQuery && ` matching "${debouncedQuery}"`}
              </p>
            )}

            <Accordion type="multiple" className="w-full border-t" defaultValue={["store-origin", "priority"]}>
              <AccordionItem value="store-origin">
                <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                  Store Origin
                  {filters.origin.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-xs">({filters.origin.length})</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          clearOriginFilters()
                        }}
                        className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                      >
                        Clear
                      </span>
                    </>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="origin-continente"
                        checked={isOriginSelected(1)}
                        onCheckedChange={() => handleOriginToggle(1)}
                      />
                      <Label
                        htmlFor="origin-continente"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <ContinenteSvg className="h-4 min-h-4 w-auto" />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="origin-auchan"
                        checked={isOriginSelected(2)}
                        onCheckedChange={() => handleOriginToggle(2)}
                      />
                      <Label
                        htmlFor="origin-auchan"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <AuchanSvg className="h-4 min-h-4 w-auto" />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="origin-pingo-doce"
                        checked={isOriginSelected(3)}
                        onCheckedChange={() => handleOriginToggle(3)}
                      />
                      <Label
                        htmlFor="origin-pingo-doce"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PingoDoceSvg className="h-4 min-h-4 w-auto" />
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="priority">
                <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                  Priority
                  {filters.priority.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-xs">({filters.priority.length})</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          clearPriorityFilters()
                        }}
                        className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                      >
                        Clear
                      </span>
                    </>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-none"
                        checked={isPrioritySelected("none")}
                        onCheckedChange={() => handlePriorityToggle("none")}
                      />
                      <Label
                        htmlFor="priority-none"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={null} useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-0"
                        checked={isPrioritySelected(0)}
                        onCheckedChange={() => handlePriorityToggle(0)}
                      />
                      <Label
                        htmlFor="priority-0"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={0} size="sm" useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-1"
                        checked={isPrioritySelected(1)}
                        onCheckedChange={() => handlePriorityToggle(1)}
                      />
                      <Label
                        htmlFor="priority-1"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={1} size="sm" useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-2"
                        checked={isPrioritySelected(2)}
                        onCheckedChange={() => handlePriorityToggle(2)}
                      />
                      <Label
                        htmlFor="priority-2"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={2} size="sm" useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-3"
                        checked={isPrioritySelected(3)}
                        onCheckedChange={() => handlePriorityToggle(3)}
                      />
                      <Label
                        htmlFor="priority-3"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={3} size="sm" useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-4"
                        checked={isPrioritySelected(4)}
                        onCheckedChange={() => handlePriorityToggle(4)}
                      />
                      <Label
                        htmlFor="priority-4"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={4} size="sm" useDescription />
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="priority-5"
                        checked={isPrioritySelected(5)}
                        onCheckedChange={() => handlePriorityToggle(5)}
                      />
                      <Label
                        htmlFor="priority-5"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={5} size="sm" useDescription />
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>

        {/* Right side - scrollable */}
        <div className={cn("flex w-full flex-col lg:w-4/5")}>
          {showLoading ? (
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
                  <StoreProductCard key={`${sp.id}-${spIdx}`} sp={sp} imagePriority={spIdx < 12} />
                ))}
              </div>

              <footer className="mt-8 flex items-center justify-between gap-4 border-t pt-4">
                <p className="text-muted-foreground text-center text-sm">
                  Showing <strong className="text-foreground">{products.length}</strong> of{" "}
                  <strong className="text-foreground">{pagination.totalCount}</strong> products
                </p>

                <div className="flex items-center gap-3">
                  {hasNextPage && (
                    <Button
                      onClick={handleLoadMore}
                      onMouseEnter={prefetchNextPage}
                      disabled={isFetchingNextPage}
                      variant="outline"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCwIcon className="size-4" />
                          Load More
                        </>
                      )}
                    </Button>
                  )}

                  {products.length > 30 && (
                    <Button variant="outline" onClick={scrollToTop} className="py-2">
                      <ArrowUpIcon />
                    </Button>
                  )}
                </div>
              </footer>
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
