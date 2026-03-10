"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFavoritesFiltered } from "@/hooks/useFavoritesFiltered"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyStateView } from "@/components/ui/combo/state-views"
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

import { ArrowRightIcon, HeartIcon, SearchIcon } from "lucide-react"

const PREVIEW_LIMIT = 12
const GRID_CLASS = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-4 xl:grid-cols-4"

export function FavoritesTab() {
  const router = useRouter()

  const {
    data: favorites,
    pagination,
    isLoading,
    isError,
  } = useFavoritesFiltered(
    {
      pagination: { page: 1, limit: PREVIEW_LIMIT },
      sort: { sortBy: "recently-added" },
    },
    { staleTime: 1000 * 60 * 2 },
  )

  const totalCount = pagination?.totalCount ?? 0

  if (isLoading) return <FavoritesTabSkeleton />

  if (isError) {
    return (
      <EmptyStateView
        icon={HeartIcon}
        title="Could not load favorites"
        message="Something went wrong. Try refreshing the page."
      />
    )
  }

  if (favorites.length === 0) {
    return (
      <EmptyStateView
        icon={HeartIcon}
        title="No favorites yet"
        message="Start adding products to your favorites to see them here."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/products")}>
            <SearchIcon className="size-4" />
            Find products
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Your most recent favorites (<span className="text-foreground font-medium">{totalCount}</span> total)
        </p>
        <Button variant="link" size="sm" asChild className="gap-1 px-0">
          <Link href="/favorites">
            View all
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className={cn(GRID_CLASS)}>
        {favorites.map((fav, idx) => (
          <StoreProductCard key={fav.id} sp={fav.store_products} imagePriority={idx < 8} favoritedAt={fav.created_at} />
        ))}
      </div>

      {totalCount > PREVIEW_LIMIT && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" asChild>
            <Link href="/favorites">
              See all {totalCount} favorites
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function FavoritesTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className={cn(GRID_CLASS)}>
        {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
