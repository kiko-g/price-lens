import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

interface Props {
  priority: number | null
  variant?: "default" | "compact"
  size?: "default" | "3xs" | "2xs" | "xs" | "sm"
  className?: string
}

export function PriorityChip({ priority, size = "2xs", variant = "compact", className }: Props) {
  const getPriorityConfig = (priority: number | null) => {
    switch (priority) {
      case null:
        return {
          label: "Unset",
          tooltip: "Unset",
          className: `bg-neutral-500 dark:text-neutral-50`,
        }
      case 0:
        return {
          label: "0/5",
          tooltip: "Useless",
          className: `bg-gray-800 dark:text-white`,
        }
      case 1:
        return {
          label: "1/5",
          tooltip: "Minor",
          className: `bg-rose-600 dark:text-white`,
        }
      case 2:
        return {
          label: "2/5",
          tooltip: "Low",
          className: `bg-orange-600 dark:text-white`,
        }
      case 3:
        return {
          label: "3/5",
          tooltip: "Medium",
          className: `bg-amber-600 dark:text-white`,
        }
      case 4:
        return {
          label: "4/5",
          tooltip: "Important",
          className: `bg-sky-600 dark:text-white`,
        }
      case 5:
        return {
          label: "5/5",
          tooltip: "Essential",
          className: `bg-emerald-700 dark:text-white`,
        }
      default:
        return {
          label: "Unknown",
          className: `bg-gray-800 dark:text-white`,
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <Badge
      size={size}
      roundedness="xs"
      variant="outline"
      className={cn(
        "gap-0.5 border-transparent text-white opacity-100 transition-all duration-300 group-hover:opacity-0 hover:opacity-100 dark:border-transparent",
        config.className,
        className,
      )}
    >
      {variant === "compact" ? (
        <span>{config.label}</span>
      ) : (
        <>
          Priority
          <span>{config.label}</span>
        </>
      )}
    </Badge>
  )
}
