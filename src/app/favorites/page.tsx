"use client"

import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useUser } from "@/hooks/useUser"
import { useFavoritesInfiniteScroll } from "@/hooks/useFavorites"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/layout"

import { StoreProductCard } from "@/components/model/StoreProductCard"
import { HeartIcon, LogInIcon, RefreshCcwIcon, Loader2Icon } from "lucide-react"

export default function FavoritesPage() {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <Layout>
        <FavoritesPageSkeleton />
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <LogInIcon className="h-8 w-8" />
              </div>
              <CardTitle>Sign in to view your favorites</CardTitle>
              <CardDescription>
                Create an account or sign in to save your favorite products and track their prices over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto mb-8 max-w-7xl px-4 py-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <HeartIcon className="fill-destructive/80 stroke-destructive h-6 w-6" />
        </div>
        <p className="text-muted-foreground mt-1 mb-6">Products you've saved for easy access and price tracking</p>

        <FavoritesGrid user={user} />
      </div>
    </Layout>
  )
}

function FavoritesGrid({ user }: { user: User }) {
  const limit = 24
  const { favorites, total, isLoading, hasMore, refresh } = useFavoritesInfiniteScroll(user, limit)

  if (isLoading && favorites.length === 0) {
    return <FavoritesGridSkeleton />
  }

  if (favorites.length === 0 && !isLoading) {
    return (
      <div className="py-12 text-center">
        <HeartIcon className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-semibold">No favorites yet</h3>
        <p className="text-muted-foreground mb-4">Start adding products to your favorites to see them here</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" className="text-sm" size="sm">
            {total} {total === 1 ? "favorite" : "favorites"}
          </Badge>
          {favorites.length > 0 && (
            <Badge variant="outline" className="text-sm" size="sm">
              Showing {favorites.length} of {total}
            </Badge>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCcwIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {favorites.map((favorite) => (
          <StoreProductCard
            key={favorite.id}
            sp={{
              ...favorite.store_products,
              is_favorited: true, // Always true since this is the favorites page
            }}
          />
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {isLoading && favorites.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>Loading more favorites...</span>
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && favorites.length > 0 && (
        <div className="border-t py-4 text-center">
          <p className="text-muted-foreground text-sm">Showing all {favorites.length} favorites</p>
        </div>
      )}
    </div>
  )
}

function FavoritesGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FavoritesPageSkeleton() {
  return (
    <div className="container mx-auto mb-8 max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-6" />
        </div>
        <Skeleton className="h-4 w-96" />
      </div>

      <FavoritesGridSkeleton />
    </div>
  )
}
