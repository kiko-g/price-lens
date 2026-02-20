"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { RANGES } from "@/types/business"

export function StoreProductCardDrawerChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1 py-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="flex items-center justify-between gap-2" key={i}>
              <div className="flex items-center gap-1.5">
                <Skeleton variant="shimmer" className="size-2 rounded-full" />
                <Skeleton variant="shimmer" className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton variant="shimmer" className="h-4 w-12" />
                <Skeleton variant="shimmer" className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex w-28 flex-col items-center gap-3 md:w-30">
          <Skeleton variant="shimmer" className="aspect-square size-28 rounded-md md:size-30" />
          <Skeleton variant="shimmer" className="h-10 w-24" />
        </div>
      </div>

      <div className="flex flex-1 shrink-0 flex-col gap-2 overflow-hidden">
        <Skeleton variant="shimmer" className="h-10 w-full rounded-lg" />
        <div className="mt-1 flex flex-col rounded-lg border">
          <Skeleton variant="shimmer" className="h-7 w-full rounded-none rounded-t-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="shimmer"
              className="-mt-px h-8 w-full rounded-none last:rounded-b-lg"
            />
          ))}
        </div>
        <Skeleton variant="shimmer" className="h-3 w-52" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((range) => (
          <Skeleton key={range} variant="shimmer" className="h-8 w-10" />
        ))}
      </div>

      <div className="mb-2 flex w-full items-center justify-center">
        <Skeleton variant="shimmer" className="aspect-video w-full rounded-lg" />
      </div>
    </div>
  )
}
