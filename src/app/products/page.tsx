import { Suspense } from "react"
import { Metadata } from "next"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { StoreProductsShowcase } from "@/components/products/StoreProductsShowcase"
import { queryStoreProducts, generateQueryKey } from "@/lib/queries/store-products"
import type { StoreProductsQueryParams, StoreProductsQueryResult } from "@/lib/queries/store-products"
import { isStoreProductsCacheEnabled, getCachedStoreProducts, setCachedStoreProducts } from "@/lib/kv"
import { buildPageTitle } from "@/lib/business/page-title"
import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components/layout/Footer"
import { HideFooter } from "@/contexts/FooterContext"
import { siteConfig } from "@/lib/config"
import type { SearchType, SortByType } from "@/types/business"
import type { PrioritySource } from "@/types"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const title = buildPageTitle({
    query: params.q,
    sortBy: params.sort,
    origins: params.origin
      ?.split(",")
      .map(Number)
      .filter((n) => !isNaN(n)),
    category: params.cat,
    onlyDiscounted: params.discounted === "true",
  })

  // Build OG image URL with filters
  const ogParams = new URLSearchParams()
  if (params.q) ogParams.set("q", params.q)
  if (params.sort) ogParams.set("sort", params.sort)
  if (params.priority_order) ogParams.set("priority_order", params.priority_order)
  if (params.origin) ogParams.set("origin", params.origin)
  if (params.cat) ogParams.set("category", params.cat)
  if (params.discounted) ogParams.set("discounted", params.discounted)

  const ogImageUrl = `${siteConfig.url}/api/og/products${ogParams.toString() ? `?${ogParams}` : ""}`

  return {
    title,
    description: `Browse and compare prices${params.q ? ` for "${params.q}"` : ""} across supermarkets`,
    openGraph: {
      title: `Price Lens | ${title}`,
      description: `Browse and compare prices${params.q ? ` for "${params.q}"` : ""} across supermarkets`,
      images: [ogImageUrl],
    },
  }
}

const LIMIT = 40

/**
 * Mirrors the client-side buildQueryParams (in StoreProductsShowcase)
 * so the server prefetch uses the exact same query key the client will.
 */
function buildServerQueryParams(
  params: { [key: string]: string | undefined },
  limit: number,
): StoreProductsQueryParams {
  const qp: StoreProductsQueryParams = {
    pagination: {
      page: Math.max(1, parseInt(params.page ?? "1", 10) || 1),
      limit,
    },
    sort: {
      sortBy: (params.sort ?? "updated-newest") as SortByType,
      prioritizeByPriority: params.priority_order !== "false",
    },
    flags: {
      excludeEmptyNames: true,
      onlyAvailable: params.available !== "false",
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

  if (params.priority) {
    const values = params.priority
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v) && v >= 0 && v <= 5)
    if (values.length > 0) qp.priority = { values }
  }

  if (params.source) {
    const values = params.source
      .split(",")
      .map((v) => v.trim())
      .filter((v): v is PrioritySource => v === "ai" || v === "manual")
    if (values.length > 0) qp.source = { values }
  }

  if (params.category) {
    const match = params.category.match(/^(\d+)/)
    const categoryId = match ? parseInt(match[1], 10) : null
    if (categoryId && categoryId > 0) qp.canonicalCategory = { categoryId }
  }

  return qp
}

/**
 * Server-side fetch with Redis cache layer.
 * 1. Redis cache hit → serve immediately (no DB call)
 * 2. Cache miss → query DB → cache result for next request
 * 3. DB error → throw so React Query treats it as a failure
 */
async function fetchWithCache(queryParams: StoreProductsQueryParams): Promise<StoreProductsQueryResult> {
  const cacheKey = JSON.stringify(queryParams)
  const cacheEnabled = isStoreProductsCacheEnabled()

  if (cacheEnabled) {
    const cached = await getCachedStoreProducts<StoreProductsQueryResult>(cacheKey)
    if (cached && cached.data.length > 0) return cached
  }

  const result = await queryStoreProducts(queryParams)
  if (result.error) throw new Error(result.error.message)

  if (cacheEnabled && result.data.length > 0) {
    await setCachedStoreProducts(cacheKey, result)
  }

  return result
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

export default async function StoreProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const queryParams = buildServerQueryParams(params, LIMIT)

  const queryClient = new QueryClient()
  const queryKey = generateQueryKey(queryParams)
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchWithCache(queryParams),
  })

  // Safety net: if server prefetch returned 0 rows (transient issue or error
  // that slipped through), evict it so the client refetches via the API route
  const prefetchedResult = queryClient.getQueryData<StoreProductsQueryResult>(queryKey)
  if (!prefetchedResult || prefetchedResult.data.length === 0) {
    queryClient.removeQueries({ queryKey })
  }

  return (
    <main className="lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden">
      <HideFooter />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingFallback />}>
          <StoreProductsShowcase limit={LIMIT}>
            <Footer className="bg-transparent px-0 pt-4 pb-0 sm:px-0 sm:pt-4 sm:pb-0 lg:px-0 lg:pt-4 lg:pb-0 dark:bg-transparent" />
          </StoreProductsShowcase>
        </Suspense>
      </HydrationBoundary>
    </main>
  )
}
