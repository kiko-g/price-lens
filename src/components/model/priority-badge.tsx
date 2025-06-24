import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"
import { MicroscopeIcon } from "lucide-react"

interface PriorityBadgeProps {
  priority: number | null
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: number | null) => {
    switch (priority) {
      case null:
        return {
          label: "Unset",
          tooltip: "Unset",
          className: `bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-500 dark:text-neutral-50 dark:border-neutral-600`,
        }
      case 0:
        return {
          label: "0/5",
          tooltip: "Useless",
          className: `bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-50 dark:border-gray-600`,
        }
      case 1:
        return {
          label: "1/5",
          tooltip: "Low",
          className: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800`,
        }
      case 2:
        return {
          label: "2/5",
          tooltip: "Medium",
          className: `bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800`,
        }
      case 3:
        return {
          label: "3/5",
          tooltip: "High",
          className: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800`,
        }
      case 4:
        return {
          label: "4/5",
          tooltip: "Important",
          className: `bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800`,
        }
      case 5:
        return {
          label: "5/5",
          tooltip: "Essential",
          className: `bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800`,
        }
      default:
        return {
          label: "Unknown",
          className: `bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`,
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            size="2xs"
            variant="outline"
            className={cn(
              "gap-0.5 border-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100",
              config.className,
            )}
          >
            <MicroscopeIcon className="h-3 w-3" />
            <span className="font-normal">{config.label}</span>
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
