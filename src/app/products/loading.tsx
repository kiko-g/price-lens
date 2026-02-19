import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

import { HideFooter } from "@/contexts/FooterContext"

const LIMIT = 20

export default function ProductsLoading() {
  return (
    <main className="lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden">
      <HideFooter />
      <div className="flex w-full flex-col lg:h-full lg:flex-row">
        {/* Desktop Sidebar skeleton */}
        <aside className="hidden h-full flex-col border-r p-4 lg:flex lg:w-80 lg:min-w-80">
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="mt-2 h-4 w-40" />

          <div className="mt-4 flex flex-col gap-2 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>

          <div className="mt-2 flex flex-col gap-2 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>

          <div className="mt-2 flex flex-col gap-2 pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>

          <div className="mt-2 flex flex-col gap-2 pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="flex w-full flex-1 flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <ProductGridWrapper className="w-full">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <StoreProductCardSkeleton key={i} />
            ))}
          </ProductGridWrapper>
        </div>
      </div>
    </main>
  )
}
