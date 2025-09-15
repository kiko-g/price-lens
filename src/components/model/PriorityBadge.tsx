import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"
import { MicroscopeIcon } from "lucide-react"

interface PriorityBadgeProps {
  priority: number | null
  variant?: "default" | "compact"
  size?: "default" | "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

export function PriorityBadge({ priority, size = "2xs", variant = "compact", className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: number | null) => {
    switch (priority) {
      case null:
        return {
          label: "Unset",
          tooltip: "Unset",
          className: `bg-neutral-500 dark:text-neutral-50 border-neutral-500`,
        }
      case 0:
        return {
          label: "0/5",
          tooltip: "Useless",
          className: `bg-gray-800 dark:text-white border-gray-800`,
        }
      case 1:
        return {
          label: "1/5",
          tooltip: "Minor",
          className: `bg-rose-600 dark:text-white border-rose-600`,
        }
      case 2:
        return {
          label: "2/5",
          tooltip: "Low",
          className: `bg-orange-600 dark:text-white border-orange-600`,
        }
      case 3:
        return {
          label: "3/5",
          tooltip: "Medium",
          className: `bg-amber-600 dark:text-white border-amber-600`,
        }
      case 4:
        return {
          label: "4/5",
          tooltip: "Important",
          className: `bg-sky-600 dark:text-white border-sky-600`,
        }
      case 5:
        return {
          label: "5/5",
          tooltip: "Essential",
          className: `bg-teal-600 dark:text-white border-teal-600 dark:border-white`,
        }
      default:
        return {
          label: "Unknown",
          className: `bg-gray-800 dark:text-white border-gray-800 dark:border-white`,
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            size={size}
            variant="outline"
            className={cn(
              "gap-0.5 text-white opacity-100 transition-all duration-300 group-hover:opacity-50",
              config.className,
              className,
            )}
          >
            {variant === "compact" ? (
              <>
                <MicroscopeIcon className="size-3" />
                <span>{config.label}</span>
              </>
            ) : (
              <>
                Priority
                <span>{config.label}</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          alignOffset={-6}
          size="xs"
          variant="glass"
          className="max-w-60"
        >
          Priority: {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
