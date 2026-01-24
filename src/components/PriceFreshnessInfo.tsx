import { cn, getShortRelativeTime } from "@/lib/utils"
import { PRIORITY_REFRESH_HOURS, formatHoursDuration } from "@/lib/business/priorities"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  const relativeTime = getShortRelativeTime(updatedDate)
  const refreshHours = priority !== null ? PRIORITY_REFRESH_HOURS[priority] : null
  const refreshLabel = refreshHours ? formatHoursDuration(refreshHours) : null

  // Determine if the price is relatively fresh (within expected window)
  const hoursSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60)
  const isFresh = refreshHours ? hoursSinceUpdate <= refreshHours : hoursSinceUpdate <= 24

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "text-muted-foreground inline-flex cursor-help items-center gap-1 text-xs",
              !isFresh && "opacity-100",
              className,
            )}
          >
            <ClockIcon className="size-3" />
            <span>Verified {relativeTime}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          alignOffset={-6}
          size="xs"
          variant="glass"
          className="max-w-72"
        >
          <p className="font-semibold">Price last verified</p>
          <p className="mt-1 text-xs">
            {updatedDate.toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {priority !== null && priority > 0 && refreshLabel && (
            <p className="mt-1 text-xs">
              This product has priority {priority} is checked every {refreshLabel}.
            </p>
          )}
          {(priority === null || priority < 2) && (
            <p className="mt-1 text-xs">
              <strong>Add to favorites</strong> to enable regular price tracking.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
