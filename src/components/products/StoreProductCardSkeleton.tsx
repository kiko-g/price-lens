"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function StoreProductCardSkeleton() {
  return (
    <div className="bg-background flex w-full flex-col rounded-lg">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <Skeleton className="border-border aspect-7/8 w-full border" />
      </div>

      <div className="mb-5 flex flex-col items-start gap-2">
        {/* Category, Brand and Name */}
        <Skeleton className="h-3 w-16 lg:w-16"></Skeleton>
        <Skeleton className="h-3 w-24 lg:w-24"></Skeleton>
        <Skeleton className="h-3 w-full lg:w-full"></Skeleton>
      </div>

      <div className="mb-1 flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12 lg:w-12"></Skeleton>
          <Skeleton className="h-4 w-20 lg:w-20"></Skeleton>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-6 lg:size-7"></Skeleton>
          <Skeleton className="size-6 lg:size-7"></Skeleton>
        </div>
      </div>
    </div>
  )
}
