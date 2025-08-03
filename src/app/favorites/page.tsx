"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@/hooks/useUser"
import { useFavorites } from "@/hooks/useFavorites"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Layout } from "@/components/layout"

import { StoreProductCard } from "@/components/model/StoreProductCard"
import { HeartIcon, ArrowLeftIcon, LogInIcon, RefreshCcwIcon } from "lucide-react"

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
        <FavoritesLoginPrompt />
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

        <FavoritesGrid />
      </div>
    </Layout>
  )
}

function FavoritesGrid() {
  const [currentPage, setCurrentPage] = useState(1)
  const { favorites, pagination, isLoading, goToPage, refresh } = useFavorites(currentPage, 20)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    goToPage(page)
  }

  if (isLoading) {
    return <FavoritesGridSkeleton />
  }

  if (favorites.length === 0) {
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
            {pagination.total} {pagination.total === 1 ? "favorite" : "favorites"}
          </Badge>
          <Badge variant="outline" className="text-sm" size="sm">
            Page {pagination.page} of {pagination.totalPages}
          </Badge>
        </div>

        <Button variant="outline" size="sm" onClick={() => refresh(currentPage, 20)} disabled={isLoading}>
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

      {/* Pagination */}
      {pagination.totalPages > 1 && <FavoritesPagination pagination={pagination} onPageChange={handlePageChange} />}
    </div>
  )
}

function FavoritesPagination({
  pagination,
  onPageChange,
}: {
  pagination: {
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  onPageChange: (page: number) => void
}) {
  const generatePageNumbers = () => {
    const pages = []
    const currentPage = pagination.page
    const totalPages = pagination.totalPages

    // Always show first page
    if (currentPage > 3) {
      pages.push(1)
      if (currentPage > 4) {
        pages.push("ellipsis1")
      }
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i)
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push("ellipsis2")
      }
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => pagination.hasPreviousPage && onPageChange(pagination.page - 1)}
            className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {generatePageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === "string" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === pagination.page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => pagination.hasNextPage && onPageChange(pagination.page + 1)}
            className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function FavoritesGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

function FavoritesLoginPrompt() {
  return (
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
  )
}

function FavoritesPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
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
