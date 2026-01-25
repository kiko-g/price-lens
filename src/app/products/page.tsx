import { Suspense } from "react"
import { Metadata } from "next"
import { StoreProductsShowcase } from "@/components/products/StoreProductsShowcase"
import { buildPageTitle } from "@/lib/business/page-title"
import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components/layout/Footer"
import { HideFooter } from "@/contexts/FooterContext"
import { siteConfig } from "@/lib/config"

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

export default function StoreProductsPage() {
  return (
    <main className="lg:h-[calc(100dvh-54px)] lg:overflow-hidden">
      <HideFooter />
      <Suspense fallback={<LoadingFallback />}>
        <StoreProductsShowcase limit={LIMIT}>
          <Footer className="bg-transparent px-0 pt-4 pb-0 sm:px-0 sm:pt-4 sm:pb-0 lg:px-0 lg:pt-4 lg:pb-0 dark:bg-transparent" />
        </StoreProductsShowcase>
      </Suspense>
    </main>
  )
}
