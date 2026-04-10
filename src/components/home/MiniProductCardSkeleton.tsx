import { Skeleton } from "@/components/ui/skeleton"

export function MiniProductCardSkeleton() {
  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-xl border">
      <div className="aspect-7/8 w-full bg-white dark:bg-white/5" />
      <div className="flex flex-col gap-0.5 p-2">
        <Skeleton className="h-[22px] w-full rounded-sm" />
        <div className="mt-0.5 flex flex-col items-start gap-y-0.5">
          <Skeleton className="h-3 w-12 rounded-sm" />
          <Skeleton className="h-3.5 w-14 rounded-sm" />
        </div>
        <Skeleton className="h-2.5 w-16 rounded-sm" />
      </div>
    </div>
  )
}
