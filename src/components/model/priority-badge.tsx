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
          className: `bg-neutral-100 text-neutral-700 dark:bg-neutral-500 dark:text-neutral-50`,
        }
      case 0:
        return {
          label: "0/5",
          tooltip: "Useless",
          className: `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white`,
        }
      case 1:
        return {
          label: "1/5",
          tooltip: "Minor",
          className: `bg-rose-50 text-rose-700 dark:bg-rose-600 dark:text-white`,
        }
      case 2:
        return {
          label: "2/5",
          tooltip: "Low",
          className: `bg-orange-50 text-orange-700 dark:bg-orange-600 dark:text-white`,
        }
      case 3:
        return {
          label: "3/5",
          tooltip: "Medium",
          className: `bg-amber-50 text-amber-700 dark:bg-amber-600 dark:text-white`,
        }
      case 4:
        return {
          label: "4/5",
          tooltip: "Important",
          className: `bg-sky-50 text-sky-700 dark:bg-sky-600 dark:text-white`,
        }
      case 5:
        return {
          label: "5/5",
          tooltip: "Essential",
          className: `bg-teal-50 text-teal-800 dark:bg-teal-600 dark:text-white`,
        }
      default:
        return {
          label: "Unknown",
          className: `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white`,
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            size="xs"
            variant="outline"
            className={cn(
              "gap-0.5 border-0 opacity-50 transition-all duration-300 group-hover:opacity-100",
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
