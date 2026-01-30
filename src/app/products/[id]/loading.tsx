import { Skeleton } from "@/components/ui/skeleton"

export default function ProductLoading() {
  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
      <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col py-0 lg:py-4">
        {/* Back button skeleton */}
        <div className="hidden w-min md:flex">
          <Skeleton className="mb-2 h-8 w-48" />
        </div>

        <div className="grid w-full gap-8 md:grid-cols-2">
          {/* Product Image skeleton */}
          <Skeleton className="aspect-square w-full rounded-lg" />

          {/* Product Details skeleton */}
          <div className="flex flex-col gap-3">
            {/* Category badge */}
            <Skeleton className="h-5 w-32" />

            {/* Brand and priority badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />

            {/* Pack info */}
            <Skeleton className="h-5 w-40" />

            {/* Price */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Price per unit and discount badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Action buttons */}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>

            {/* Chart area */}
            <div className="mt-4 flex-1">
              <Skeleton className="h-64 w-full max-w-xl rounded-lg" />
            </div>
          </div>
        </div>

        {/* Separator and related products */}
        <Skeleton className="my-6 h-px w-full" />

        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
