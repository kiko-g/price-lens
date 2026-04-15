import { Skeleton } from "@/components/ui/skeleton"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

export default function DealsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Title + subtitle: matches DealsShowcase mb-6 space-y-1 */}
      <div className="mb-6 space-y-1">
        <Skeleton className="h-8 w-56 lg:h-9" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Store filter chips: matches DealsShowcase overflow-x-auto pb-1 */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Tabs bar: matches TabsList chrome (bg-muted rounded container) */}
      <div className="bg-muted mb-4 inline-flex h-9 items-center gap-1 rounded-lg p-[3px]">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>

      {/* Product grid: matches DealsShowcase grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
