"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function StoreProductCardSkeleton() {
  return (
    <div className="bg-background flex w-full flex-col rounded-lg">
      {/* Image: mb-2 matches real card */}
      <div className="relative mb-2 overflow-hidden rounded-md border border-transparent">
        <Skeleton className="aspect-8/7 w-full" />
      </div>

      {/* Category badge + brand + name: mirrors real card text block */}
      <div className="flex flex-1 flex-col items-start">
        <div className="flex w-full flex-col items-start">
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="mt-1.5 h-3 w-24" />
          <Skeleton className="mt-1 h-3 w-full" />
          <Skeleton className="mt-0.5 h-3 w-3/4" />
        </div>

        {/* Price + action buttons */}
        <div className="mt-2 flex w-full items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="size-6 lg:size-7" />
            <Skeleton className="size-6 lg:size-7" />
          </div>
        </div>
      </div>
    </div>
  )
}
