import { Skeleton } from "@/components/ui/skeleton"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

export default function DealsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56 lg:h-9" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div className="mb-5 hidden flex-wrap gap-2 lg:flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-40 shrink-0 rounded-lg" />
        ))}
      </div>

      <Skeleton className="mb-5 h-11 w-full rounded-lg lg:hidden" />

      <div className="mb-4 hidden justify-between lg:flex">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
