import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/business/chart"
import { PRIORITY_REFRESH_HOURS, formatHoursDuration } from "@/lib/business/priority"

import { ResponsiveTooltip } from "@/components/ui/combo/responsive-tooltip"
import { ClockIcon } from "lucide-react"

interface PriceFreshnessInfoProps {
  updatedAt: string | null
  priority: number | null
  className?: string
}

/**
 * Subtle informational component showing when a price was last verified.
 * Designed for product detail pages - informative without being alarming.
 */
export function PriceFreshnessInfo({ updatedAt, priority, className }: PriceFreshnessInfoProps) {
  if (!updatedAt) {
    return null
  }

  const updatedDate = new Date(updatedAt)
  const relativeTime = formatRelativeTime(updatedDate, "relative")
  const refreshHours = priority !== null ? PRIORITY_REFRESH_HOURS[priority] : null
  const refreshLabel = refreshHours ? formatHoursDuration(refreshHours) : null

  const hoursSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60)
  const isFresh = refreshHours ? hoursSinceUpdate <= refreshHours : hoursSinceUpdate <= 24

  const absoluteDateLabel = updatedDate.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <ResponsiveTooltip
      title="Price last verified"
      drawerTitleClassName="text-[15px] font-medium text-muted-foreground"
      trigger={
        <button
          type="button"
          className={cn(
            "text-muted-foreground inline-flex cursor-pointer items-center gap-0.5 text-xs md:cursor-help",
            !isFresh && "opacity-100",
            className,
          )}
          aria-label={`Price verification details. Last verified ${relativeTime}.`}
        >
          <ClockIcon className="size-3 shrink-0" aria-hidden />
          <span>Verified {relativeTime}</span>
        </button>
      }
    >
      <div className="space-y-5 md:contents">
        <div className="md:hidden">
          <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{absoluteDateLabel}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-snug">
            When our scrape confirms the listing, we record this timestamp.
          </p>
        </div>
        <p className="mt-1 hidden md:block">{absoluteDateLabel}</p>

        {priority !== null && priority > 0 && refreshLabel && (
          <>
            <p className="mt-1 hidden md:block">
              This product has priority <strong>{priority}</strong> meaning it is checked every{" "}
              <strong>{refreshLabel}</strong>.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed md:hidden">
              We aim to refresh about every <span className="text-foreground font-medium">{refreshLabel}</span>
              {". "}
              Priority <span className="text-foreground font-medium tabular-nums">{priority}</span> sets how often it is
              queued.
            </p>
          </>
        )}

        {(priority === null || priority < 2) && (
          <>
            <p className="mt-1 hidden md:block">
              <strong>Add to favorites</strong> to enable regular price tracking.
            </p>
            <div className="border-border/60 border-t pt-5 md:hidden">
              <p className="text-muted-foreground text-sm leading-relaxed">
                <span className="text-foreground font-medium">Favorites</span> — add this product to bump how often we
                check it.
              </p>
            </div>
          </>
        )}
      </div>
    </ResponsiveTooltip>
  )
}
