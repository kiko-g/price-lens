import { Skeleton } from "@/components/ui/skeleton"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

export default function ProfileLoading() {
  return (
    <div className="flex w-full items-start justify-start">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="container mx-auto max-w-[1600px] space-y-6 p-4 pt-6 md:p-6 md:pt-8">
        <div className="flex grow flex-col gap-6 pb-6 md:flex-row">
          {/* Sidebar skeleton: desktop */}
          <div className="hidden shrink-0 flex-col items-center md:flex md:w-64">
            <Skeleton className="mx-auto mb-4 h-32 w-32 rounded-full" />
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="mb-3 h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="mt-4 h-16 w-full rounded-md" />
          </div>

          {/* Sidebar skeleton: mobile */}
          <div className="flex items-center gap-4 border-b pb-4 md:hidden">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Tabs skeleton: 6 pills matching real TabsList */}
          <div className="min-w-0 flex-1">
            <div className="bg-muted inline-flex h-10 items-center gap-1 rounded-md p-1">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-[72px]" />
            </div>
            <div className="mt-4 space-y-4">
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
