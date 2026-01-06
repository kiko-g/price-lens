import { cn } from "@/lib/utils"

export function DevBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("rounded bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-600 dark:text-amber-400", className)}
    >
      DEV
    </span>
  )
}
