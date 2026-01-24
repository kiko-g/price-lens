import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/lib/business/priorities"

type BubbleSize = "xs" | "sm" | "md" | "lg"

interface PriorityBubbleProps {
  priority: number | null
  size?: BubbleSize
  useDescription?: boolean
  className?: string
}

const SIZE_CLASSES: Record<BubbleSize, string> = {
  xs: "size-4 text-[10px]",
  sm: "size-5 text-xs",
  md: "size-6 text-sm",
  lg: "size-8 text-base",
}

export function PriorityBubble({ priority, size = "sm", useDescription = false, className }: PriorityBubbleProps) {
  const key = priority === null ? "null" : String(priority)
  const config = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG["null"]

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border font-mono font-medium text-white",
          config.bgClass,
          SIZE_CLASSES[size],
        )}
      >
        {config.label}
      </span>
      {useDescription && <span className="text-sm">{config.description}</span>}
    </span>
  )
}
