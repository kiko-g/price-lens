import { Skeleton } from "@/components/ui/skeleton"

export default function CompareLoading() {
  return (
    <div className="flex w-full flex-col items-center justify-start p-4">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4">
          <Skeleton className="hidden h-9 w-24 md:block" />

          <div className="grid gap-6 md:grid-cols-[1fr,auto]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-9 w-full max-w-lg" />
            </div>

            <Skeleton className="h-16 w-40" />
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-xl border">
              {/* Store Header */}
              <div className="border-b bg-muted/30 px-3 py-2">
                <Skeleton className="h-6 w-20" />
              </div>

              {/* Product Image */}
              <Skeleton className="aspect-square w-full" />

              {/* Price Section */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />

                <div className="mt-auto flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
