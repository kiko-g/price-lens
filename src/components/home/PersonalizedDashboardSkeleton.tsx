import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MiniProductCardSkeleton } from "@/components/home/MiniProductCardSkeleton"

export function PersonalizedDashboardSkeleton() {
  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Greeting + search bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 lg:h-9" variant="shimmer" />
          <Skeleton className="h-4 w-80" variant="shimmer" />
        </div>
        <Skeleton className="h-[50px] w-full rounded-xl md:h-[50px] lg:max-w-md" variant="shimmer" />
      </div>

      {/* Quick action cards — matches QuickActionCard structure: bg-card border p-3 lg:p-4, icon size-8 + two text lines */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border-border flex h-[60px] items-center gap-3 rounded-xl border p-3 md:h-[68px] lg:p-4"
          >
            <Skeleton className="size-8 shrink-0 rounded-lg" variant="shimmer" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-16" variant="shimmer" />
              <Skeleton className="h-2.5 w-24" variant="shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked dashboard sections — matches DashboardSection using Card/CardHeader/CardContent */}
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" variant="shimmer" />
                <Skeleton className="h-4 w-24" variant="shimmer" />
              </div>
              <Skeleton className="h-3 w-14" variant="shimmer" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 gap-2 md:hidden">
                {Array.from({ length: 6 }).map((_, j) => (
                  <MiniProductCardSkeleton key={j} />
                ))}
              </div>
              {/* dot row placeholder — Favorites usually has 2+ pages so dots render */}
              {i === 0 && (
                <div className="mt-3 flex items-center justify-center gap-1.5 md:hidden">
                  <Skeleton variant="shimmer" className="h-1.5 w-4 rounded-full" />
                  <Skeleton variant="shimmer" className="h-1.5 w-1.5 rounded-full" />
                  <Skeleton variant="shimmer" className="h-1.5 w-1.5 rounded-full" />
                </div>
              )}
              <div className="hidden grid-cols-4 gap-2 md:grid xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, j) => (
                  <MiniProductCardSkeleton key={j} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
