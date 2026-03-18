"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyStateView } from "@/components/ui/combo/state-views"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { HomeIcon, RefreshCcwIcon } from "lucide-react"

export function DebounceProgressBar({ durationMs }: { durationMs: number }) {
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="bg-foreground/20 hidden h-[5px] w-16 overflow-hidden rounded-full md:block">
      <div
        className="bg-foreground h-full rounded-full transition-[width] ease-linear"
        style={{ width: filled ? "100%" : "0%", transitionDuration: `${durationMs - 100}ms` }}
      />
    </div>
  )
}

export function LoadingGrid({ limit }: { limit: number }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <ProductGridWrapper className="w-full">
        {Array.from({ length: limit }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </ProductGridWrapper>
    </div>
  )
}

export function EmptyState({ query, onClearFilters }: { query: string; onClearFilters: () => void }) {
  const router = useRouter()

  return (
    <div className="flex flex-1 items-start justify-center p-4">
      <EmptyStateView
        title="No results found"
        message={
          query
            ? `We couldn't find any products matching "${query}". Try a different search term or clear your filters.`
            : "Try adjusting your filters to find what you're looking for."
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <RefreshCcwIcon className="size-4" />
              Clear filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <HomeIcon className="size-4" />
              Return home
            </Button>
          </div>
        }
      />
    </div>
  )
}
