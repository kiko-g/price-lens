import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG, PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"

type BadgeSize = "sm" | "md" | "lg"

const SIZE_MAP: Record<
  BadgeSize,
  {
    pill: string
    activePill: string
    fontSize: string
    activeFontSize: string
    gap: string
    wrapper: string
    label: string
  }
> = {
  sm: {
    pill: "h-5 w-5 text-[10px]",
    activePill: "h-6 w-6 text-xs",
    fontSize: "text-[10px]",
    activeFontSize: "text-xs",
    gap: "gap-px",
    wrapper: "gap-1.5",
    label: "text-xs",
  },
  md: {
    pill: "h-6 w-6 text-xs",
    activePill: "h-7 w-7 text-sm",
    fontSize: "text-xs",
    activeFontSize: "text-sm",
    gap: "gap-0.5",
    wrapper: "gap-2",
    label: "text-sm",
  },
  lg: {
    pill: "h-7 w-7 text-sm",
    activePill: "h-9 w-9 text-base",
    fontSize: "text-sm",
    activeFontSize: "text-base",
    gap: "gap-0.5",
    wrapper: "gap-2.5",
    label: "text-base",
  },
}

interface PriorityScoreProps {
  priority: number | null
  showLabel?: boolean
  showDescription?: boolean
  size?: BadgeSize
  className?: string
}

export function PriorityScore({
  priority,
  showLabel = false,
  showDescription = false,
  size = "md",
  className,
}: PriorityScoreProps) {
  const isNull = priority === null
  const key = isNull ? "null" : String(priority)
  const config = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG["null"]
  const s = SIZE_MAP[size]

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        role="img"
        className={cn("inline-flex items-center", s.wrapper, className)}
        aria-label={`Priority ${config.label}: ${config.description}`}
      >
        {/* Pill strip */}
        <div className={cn("flex items-center", s.gap)}>
          {PRODUCT_PRIORITY_LEVELS.map((level) => {
            const levelKey = String(level)
            const levelConfig = PRIORITY_CONFIG[levelKey]
            const isActive = !isNull && level === priority

            if (isActive) {
              return (
                <span
                  key={levelKey}
                  className={cn(
                    "relative z-10 inline-flex shrink-0 items-center justify-center rounded-[10px] font-bold text-white shadow-sm",
                    levelConfig.bgClass,
                    s.activePill,
                  )}
                >
                  {level}
                </span>
              )
            }

            const isFirst = level === 0
            const isLast = level === 5

            return (
              <span
                key={levelKey}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center font-medium text-white opacity-50",
                  levelConfig.bgClass,
                  s.pill,
                  isFirst && "rounded-l",
                  isLast && "rounded-r",
                )}
              >
                {level}
              </span>
            )
          })}
        </div>

        {/* Optional text label */}
        {showLabel && <span className={cn("font-medium", s.label)}>{config.description}</span>}
      </div>

      {showDescription && (
        <span className={cn("text-muted-foreground text-xs font-normal", s.label)}>{config.explanation}</span>
      )}
    </div>
  )
}
