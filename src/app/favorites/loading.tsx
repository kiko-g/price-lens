import { Skeleton } from "@/components/ui/skeleton"
import { HideFooter } from "@/contexts/FooterContext"

const LIMIT = 40

export default function FavoritesLoading() {
  return (
    <main className="lg:h-[calc(100dvh-54px)] lg:overflow-hidden">
      <HideFooter />
      <div className="flex w-full flex-col lg:h-full lg:flex-row">
        {/* Desktop Sidebar skeleton */}
        <aside className="hidden h-full flex-col border-r p-4 lg:flex lg:w-80 lg:min-w-80">
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="flex w-full flex-1 flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
