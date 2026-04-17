import { Skeleton } from "@/components/ui/skeleton"

export function MiniProductCardSkeleton() {
  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-xl border">
      <div className="aspect-square w-full bg-white dark:bg-white/5" />
      <div className="flex flex-col gap-0.5 p-2">
        {/* 2 lines of text-xs leading-tight = 15px × 2 = 30px */}
        <Skeleton variant="shimmer" className="h-[30px] w-full rounded-sm" />
        <div className="mt-0.5 flex flex-col items-start gap-y-0.5">
          {/* logoSmall renders at h-[15px] */}
          <Skeleton variant="shimmer" className="h-[15px] w-12 rounded-sm" />
          <Skeleton variant="shimmer" className="h-3.5 w-14 rounded-sm" />
        </div>
        <Skeleton variant="shimmer" className="h-2.5 w-16 rounded-sm" />
      </div>
    </div>
  )
}
