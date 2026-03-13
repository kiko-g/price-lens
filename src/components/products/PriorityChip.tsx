import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/lib/business/priority"

interface Props {
  priority: number | null
  variant?: "default" | "compact"
  size?: "default" | "3xs" | "2xs" | "xs" | "sm"
  className?: string
}

export function PriorityChip({ priority, size = "2xs", variant = "compact", className }: Props) {
  const key = priority === null ? "null" : String(priority)
  const config = PRIORITY_CONFIG[key]
  const label = priority === null ? (config?.label ?? "?") : `${priority}/5`
  const tooltip = config?.description ?? "?"
  const bgClass = config?.bgClass ?? "bg-gray-800 dark:text-white"

  return (
    <Badge
      size={size}
      roundedness="xs"
      variant="outline"
      className={cn(
        "gap-0.5 border-transparent text-white opacity-100 transition-all duration-300 group-hover:opacity-0 hover:opacity-100 dark:border-transparent",
        bgClass,
        className,
      )}
      title={tooltip}
    >
      {variant === "compact" ? (
        <span>{label}</span>
      ) : (
        <>
          Priority
          <span>{label}</span>
        </>
      )}
    </Badge>
  )
}
