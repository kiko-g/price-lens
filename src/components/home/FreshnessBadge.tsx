import { CircleCheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function FreshnessBadge({
  computedAt,
  className,
}: {
  computedAt: string | null
  className?: string
}) {
  const label = computedAt ? getRelativeLabel(computedAt) : "Updated recently"

  return (
    <div className={cn("text-muted-foreground flex items-center gap-1.5 text-xs", className)}>
      <CircleCheckIcon className="size-3 text-emerald-500" />
      <span>{label}</span>
      <span className="mx-1">·</span>
      <span>Tracking since Mar 2025</span>
    </div>
  )
}

function getRelativeLabel(isoDate: string): string {
  const now = Date.now()
  const computed = new Date(isoDate).getTime()
  const hoursAgo = Math.floor((now - computed) / (1000 * 60 * 60))

  if (hoursAgo < 1) return "Updated just now"
  if (hoursAgo < 24) return `Updated ${hoursAgo}h ago`
  return "Updated today"
}
