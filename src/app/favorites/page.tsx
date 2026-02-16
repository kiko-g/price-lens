import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"

import { userQueries } from "@/lib/queries/user"
import { favoriteQueries, type FavoritesQueryParams, type FavoritesSortType } from "@/lib/queries/favorites"
import { generateQueryKey } from "@/hooks/useFavoritesFiltered"
import type { SearchType } from "@/types/business"

import { FavoritesShowcase } from "@/components/favorites/FavoritesShowcase"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/layout/Footer"
import { HideFooter } from "@/contexts/FooterContext"

import { LogInIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "My Favorites",
  description: "View and manage your favorite products with price tracking across supermarkets.",
}

const LIMIT = 20

/**
 * Mirrors the client-side buildQueryParams (in FavoritesShowcase)
 * so the server prefetch uses the exact same query key the client will.
 */
function buildServerQueryParams(params: { [key: string]: string | undefined }, limit: number): FavoritesQueryParams {
  const qp: FavoritesQueryParams = {
    pagination: {
      page: Math.max(1, parseInt(params.page ?? "1", 10) || 1),
      limit,
    },
    sort: {
      sortBy: (params.sort ?? "recently-added") as FavoritesSortType,
    },
    flags: {
      onlyDiscounted: params.discounted === "true",
    },
  }

  const q = params.q?.trim()
  if (q) {
    qp.search = { query: q, searchIn: (params.t ?? "any") as SearchType }
  }

  if (params.origin) {
    const ids = params.origin
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v))
    if (ids.length === 1) qp.origin = { originIds: ids[0] }
    else if (ids.length > 1) qp.origin = { originIds: ids }
  }

  return qp
}

function LoadingFallback() {
  return (
    <div className="flex w-full flex-col gap-3 p-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: LIMIT }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function FavoritesPage({ searchParams }: PageProps) {
  const { data: user } = await userQueries.getCurrentUser()

  if (!user) {
    return (
      <main className="flex items-center justify-center lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden">
        <HideFooter />
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
      </main>
    )
  }

  const params = await searchParams
  const queryParams = buildServerQueryParams(params, LIMIT)

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: generateQueryKey(queryParams),
    queryFn: () => favoriteQueries.getUserFavoritesFiltered(user.id, queryParams),
  })

  return (
    <main className="lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden">
      <HideFooter />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingFallback />}>
          <FavoritesShowcase limit={LIMIT}>
            <Footer className="bg-transparent px-0 pt-4 pb-0 sm:px-0 sm:pt-4 sm:pb-0 lg:px-0 lg:pt-4 lg:pb-0 dark:bg-transparent" />
          </FavoritesShowcase>
        </Suspense>
      </HydrationBoundary>
    </main>
  )
}
