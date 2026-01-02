import { cn } from "@/lib/utils"

type BubbleSize = "xs" | "sm" | "md" | "lg"

interface PriorityBubbleProps {
  priority: number | null
  size?: BubbleSize
  useDescription?: boolean
  className?: string
}

const PRIORITY_CONFIG: Record<string, { label: string; description: string; bgClass: string }> = {
  null: { label: "?", description: "Unset", bgClass: "bg-neutral-500/70 border-neutral-500" },
  "0": { label: "0", description: "Useless", bgClass: "bg-gray-800/70  border-gray-800" },
  "1": { label: "1", description: "Minor", bgClass: "bg-rose-600/70 border-rose-600" },
  "2": { label: "2", description: "Low", bgClass: "bg-orange-600/70 border-orange-600" },
  "3": { label: "3", description: "Medium", bgClass: "bg-amber-600/70 border-amber-600" },
  "4": { label: "4", description: "Important", bgClass: "bg-sky-600/70 border-sky-600" },
  "5": { label: "5", description: "Essential", bgClass: "bg-emerald-700/70 border-emerald-700" },
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
