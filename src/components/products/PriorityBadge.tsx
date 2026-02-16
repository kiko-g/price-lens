import { Badge, BadgeProps } from "@/components/ui/badge"
import { PRIORITY_CONFIG } from "@/lib/business/priority"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { NavigationOffIcon, PickaxeIcon } from "lucide-react"

type Props = {
  priority: number | null
} & BadgeProps

export function PriorityBadge({ priority, ...props }: Props) {
  const normalizedPriority = priority ?? 0
  const config = PRIORITY_CONFIG[String(normalizedPriority)] ?? PRIORITY_CONFIG["0"]

  if (priority === null || priority === 0) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" size="sm" roundedness="sm" {...props}>
              <NavigationOffIcon className="h-4 w-4" />
              Untracked product
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
            <p className="font-semibold">{config.description}</p>
            {config.explanation}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={PRIORITY_CONFIG[priority].badgeKind} size="sm" roundedness="sm" {...props}>
            <PickaxeIcon className="h-4 w-4" />
            Priority {priority}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
          <p className="font-semibold">{config.description}</p>
          {config.explanation}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
