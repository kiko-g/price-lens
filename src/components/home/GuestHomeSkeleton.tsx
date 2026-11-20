import { Skeleton } from "@/components/ui/skeleton"
import { MiniProductCardSkeleton } from "@/components/products/MiniProductCardSkeleton"

/** Mirrors GuestHome: copy, search, three stats, four entry points, three chains, eight products, account card. */
export function GuestHomeSkeleton() {
  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 pt-6 pb-12 lg:px-8 lg:pt-10 lg:pb-16">
      <div className="max-w-2xl">
        <Skeleton className="mb-3 h-3 w-40" variant="shimmer" />
        <Skeleton className="h-[4.4rem] w-full max-w-xl sm:h-16 lg:h-[3.6rem]" variant="shimmer" />
        <Skeleton className="mt-3 h-10 w-full max-w-xl" variant="shimmer" />
      </div>

      <div className="mt-5 flex max-w-xl items-center gap-2.5">
        <Skeleton className="h-[52px] min-w-0 flex-1 rounded-xl" variant="shimmer" />
        <Skeleton className="h-[52px] w-28 shrink-0 rounded-xl max-[420px]:size-11" variant="shimmer" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-4 w-40" variant="shimmer" />
        <Skeleton className="mt-1 h-3 w-56" variant="shimmer" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          <Skeleton className="h-[92px] rounded-none" variant="shimmer" />
          <Skeleton className="h-[92px] rounded-none" variant="shimmer" />
          <Skeleton className="col-span-2 h-[92px] rounded-none sm:col-span-1" variant="shimmer" />
        </div>
      </div>

      <Skeleton className="mt-3 h-4 w-56" variant="shimmer" />

      <div className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" variant="shimmer" />
        ))}
      </div>

      <div className="mt-8">
        <Skeleton className="mb-3 h-4 w-36" variant="shimmer" />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-2xl" variant="shimmer" />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <Skeleton className="h-5 w-40" variant="shimmer" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" variant="shimmer" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MiniProductCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <Skeleton className="mt-10 h-64 w-full rounded-xl sm:h-56" variant="shimmer" />
    </div>
  )
}
