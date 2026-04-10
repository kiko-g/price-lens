import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"
import { HideFooter } from "@/contexts/FooterContext"

const LIMIT = 20

export default function FavoritesLoading() {
  return (
    <main className="lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden">
      <HideFooter />
      <div className="flex w-full flex-col lg:h-full lg:flex-row">
        {/* Desktop Sidebar skeleton — matches FavoritesShowcase aside */}
        <aside className="hidden h-full flex-col overflow-y-auto border-r p-4 lg:flex lg:w-80 lg:min-w-80">
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </aside>

        {/* Main content skeleton — matches FavoritesShowcase main column */}
        <div className="flex w-full flex-1 flex-col p-4 lg:h-full lg:overflow-y-auto">
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
