import { cn } from "@/lib/utils"
import { getPriceStaleness, formatHoursDuration, DEFAULT_STALENESS_LENIENCE_HOURS } from "@/lib/business/priority"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClockIcon } from "lucide-react"

interface StalePriceBadgeProps {
  updatedAt: string | null
  priority: number | null
  lenienceHours?: number
  variant?: "default" | "compact" | "icon-only"
  size?: "3xs" | "2xs" | "xs" | "sm"
  className?: string
}

export function StalePriceBadge({
  updatedAt,
  priority,
  lenienceHours = DEFAULT_STALENESS_LENIENCE_HOURS,
  variant = "compact",
  size = "2xs",
  className,
}: StalePriceBadgeProps) {
  const staleness = getPriceStaleness(updatedAt, priority, lenienceHours)

  // Don't render if price is fresh or we can't determine staleness
  if (!staleness.isStale || staleness.expectedRefreshHours === null) {
    return null
  }

  const expectedRefreshLabel = formatHoursDuration(staleness.expectedRefreshHours)
  const overdueLabel = formatHoursDuration(staleness.hoursOverdue)
  const lastUpdateLabel = formatHoursDuration(staleness.hoursSinceUpdate)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            size={variant === "icon-only" ? "icon-xs" : size}
            roundedness="sm"
            variant="outline-warning"
            className={cn("cursor-help gap-1", className)}
          >
            <ClockIcon className="size-3" />
            {variant === "default" && <span>Price may be outdated</span>}
            {variant === "compact" && <span>Stale</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
          <p className="font-semibold">Price may be outdated</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Last verified {lastUpdateLabel} ago ({overdueLabel} overdue).
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Priority {priority} products are checked every {expectedRefreshLabel}.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Hook to check if a price is stale (useful for conditional rendering)
 */
export function useIsPriceStale(updatedAt: string | null, priority: number | null): boolean {
  const staleness = getPriceStaleness(updatedAt, priority)
  return staleness.isStale
}
