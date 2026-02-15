import { Badge } from "@/components/ui/badge"
import { PRIORITY_CONFIG } from "@/lib/business/priority"
import { NavigationOffIcon } from "lucide-react"

type Props = {
  priority: number | null
}

export function PriorityBadge({ priority }: Props) {
  if (priority === null || priority === 0) {
    return (
      <Badge variant="destructive" size="sm" roundedness="sm">
        <NavigationOffIcon className="h-4 w-4" />
        Untracked product
      </Badge>
    )
  }

  return (
    <Badge variant={PRIORITY_CONFIG[priority].badgeKind} size="sm" roundedness="sm">
      Priority {priority}
    </Badge>
  )
}
