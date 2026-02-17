import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const SKELETON_COUNT = 6

function BreadcrumbSkeleton() {
  return (
    <div className="mb-2 flex items-center gap-1 md:mb-3">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-4 w-28 font-semibold" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-3">
        {/* PricesVariation skeleton */}
        <div className="order-2 flex max-w-2xl flex-col gap-2 xl:col-start-1 xl:row-start-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* PriceTable skeleton */}
        <div className="order-1 max-w-2xl xl:col-start-1 xl:row-start-2">
          <div className="max-h-[280px] min-w-100 xl:max-h-80 xl:max-w-full">
            <Skeleton className="mb-2 h-8 w-full rounded-md" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="mt-2 h-3 w-48" />
          </div>
        </div>

        {/* RangeSelector + Graph skeleton */}
        <div className="xl:bg-foreground/2 xl:dark:bg-foreground/2 order-3 flex h-fit max-w-xl flex-col gap-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:rounded-lg xl:px-2 xl:pt-3 xl:pb-0">
          <div className="flex gap-1 xl:justify-start">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-10 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-60 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

function DesktopHeroSkeleton() {
  return (
    <article className="hidden w-full grid-cols-20 gap-8 md:grid">
      {/* Left column: Image + Barcode (col-span-6 matches ProductHeroDesktop) */}
      <aside className="col-span-6 flex flex-col items-center">
        <Skeleton className="aspect-7/8 w-full rounded-lg" />
        <div className="mt-4 flex items-center gap-1">
          <Skeleton className="h-[35px] w-40" />
        </div>
      </aside>

      {/* Right column: Details (col-span-14 matches ProductHeroDesktop) */}
      <section className="col-span-14 flex flex-col gap-2">
        {/* Brand, priority, store badges */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>

        {/* Title + Pack */}
        <div className="flex flex-col gap-0">
          <Skeleton className="h-6 w-3/4 xl:h-7" />
          <Skeleton className="mt-1 h-5 w-24" />
        </div>

        {/* Price */}
        <div className="flex flex-col items-start justify-start gap-2">
          <Skeleton className="h-6 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-sm" />
            <Skeleton className="h-5 w-14 rounded-sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        <ChartSkeleton />
      </section>
    </article>
  )
}

function MobileHeroSkeleton() {
  return (
    <article className="flex w-full flex-col gap-2.5 md:hidden">
      <Skeleton className="aspect-6/5 w-full rounded-lg" />

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-sm" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>

      <div className="flex flex-col gap-0">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="mt-1 h-4 w-24" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-5 w-20 rounded-sm" />
      </div>

      <Skeleton className="h-4 w-28" />

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      <div className="mt-4">
        <ChartSkeleton />
      </div>
    </article>
  )
}

function IdenticalProductsSkeleton() {
  return (
    <div className="flex min-h-[180px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="mb-3">
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-lg border p-3">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-6 w-20" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg">
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <Skeleton className="border-border aspect-7/8 w-full border" />
      </div>
      <div className="mb-5 flex flex-col items-start gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="mb-1 flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 lg:size-7" />
          <Skeleton className="size-6 lg:size-7" />
        </div>
      </div>
    </div>
  )
}

function RelatedProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="-ml-4 flex">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="min-w-0 shrink-0 pl-4 basis-[46%] sm:basis-2/5 md:basis-1/3 lg:basis-1/5 xl:basis-1/6">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProductLoading() {
  return (
    <div className="relative flex w-full flex-col items-center justify-start gap-4 p-4">
      <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col py-0 lg:py-4">
        <BreadcrumbSkeleton />
        <DesktopHeroSkeleton />
        <MobileHeroSkeleton />

        <Separator className="mt-8 mb-4" />
        <IdenticalProductsSkeleton />
        <Separator className="mt-8 mb-4" />
        <RelatedProductsSkeleton />
      </div>
    </div>
  )
}
