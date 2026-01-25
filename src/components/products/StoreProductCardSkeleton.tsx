"use client"

import { Skeleton } from "@/components/ui/skeleton"

type Props = {
  variant?: "vertical" | "horizontal"
}

export function StoreProductCardSkeleton({ variant = "vertical" }: Props) {
  if (variant === "horizontal") {
    return (
      <div className="bg-background flex w-full flex-row items-start gap-3 rounded-lg border p-2">
        {/* Compact image skeleton */}
        <Skeleton className="h-20 w-20 shrink-0 rounded-md" />

        {/* Info section skeleton */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
          {/* Top row: brand + category + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="size-6" />
              <Skeleton className="size-6" />
              <Skeleton className="size-6" />
            </div>
          </div>

          {/* Product name */}
          <Skeleton className="h-4 w-full" />

          {/* Bottom row: price + pack + store */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-16" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vertical variant (default)
  return (
    <div className="bg-background flex w-full flex-col rounded-lg">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <Skeleton className="border-border aspect-square w-full border" />
      </div>

      <div className="mb-5 flex flex-col items-start gap-2">
        {/* Category, Brand and Name */}
        <Skeleton className="h-3 w-16 lg:w-16" />
        <Skeleton className="h-3 w-24 lg:w-24" />
        <Skeleton className="h-3 w-full lg:w-full" />
      </div>

      <div className="mb-1 flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12 lg:w-12" />
          <Skeleton className="h-4 w-20 lg:w-20" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-6 lg:size-7" />
          <Skeleton className="size-6 lg:size-7" />
        </div>
      </div>
    </div>
  )
}
