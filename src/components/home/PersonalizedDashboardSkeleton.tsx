import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MiniProductCardSkeleton } from "@/components/home/PersonalizedDashboard"

export function PersonalizedDashboardSkeleton() {
  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      {/* Greeting + search bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 lg:h-9" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl lg:max-w-md" />
      </div>

      {/* Quick action cards — matches QuickActionCard structure: bg-card border p-3 lg:p-4, icon size-8 + two text lines */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border-border flex items-center gap-3 rounded-xl border p-3 lg:p-4">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked dashboard sections — matches DashboardSection using Card/CardHeader/CardContent */}
      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-14" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 gap-2 md:hidden">
                {Array.from({ length: 6 }).map((_, j) => (
                  <MiniProductCardSkeleton key={j} />
                ))}
              </div>
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
