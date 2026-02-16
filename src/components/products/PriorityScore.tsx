import { cn } from "@/lib/utils"
import { PRIORITY_CONFIG, PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type BadgeSize = "xs" | "sm" | "md" | "lg"

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
  xs: {
    pill: "h-4 w-4 text-[10px]",
    activePill: "h-5 w-5 text-xs",
    fontSize: "text-[10px]",
    activeFontSize: "text-xs",
    gap: "gap-0",
    wrapper: "gap-1",
    label: "text-xs",
  },
  sm: {
    pill: "h-5 w-5 text-[10px]",
    activePill: "h-6 w-6 text-xs",
    fontSize: "text-xs",
    activeFontSize: "text-sm",
    gap: "gap-0",
    wrapper: "gap-1.5",
    label: "text-xs",
  },
  md: {
    pill: "h-6 w-6 text-xs",
    activePill: "h-7 w-7 text-sm",
    fontSize: "text-xs",
    activeFontSize: "text-sm",
    gap: "gap-0",
    wrapper: "gap-2",
    label: "text-sm",
  },
  lg: {
    pill: "h-7 w-7 text-sm",
    activePill: "h-9 w-9 text-base",
    fontSize: "text-sm",
    activeFontSize: "text-base",
    gap: "gap-0",
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
  wrapperClassName?: string
}

export function PriorityScore({
  priority,
  showLabel = false,
  showDescription = false,
  size = "md",
  className,
  wrapperClassName,
}: PriorityScoreProps) {
  const normalizedPriority = priority ?? 0
  const config = PRIORITY_CONFIG[String(normalizedPriority)] ?? PRIORITY_CONFIG["0"]
  const s = SIZE_MAP[size]

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex flex-col items-center gap-0.5", wrapperClassName)}>
            <div
              role="img"
              className={cn("inline-flex items-center", s.wrapper, className)}
              aria-label={`Priority ${config.label}: ${config.description}`}
            >
              <div className={cn("flex items-center", s.gap)}>
                {PRODUCT_PRIORITY_LEVELS.map((level) => {
                  const levelKey = String(level)
                  const levelConfig = PRIORITY_CONFIG[levelKey]
                  const isActive = level === normalizedPriority
                  const isFirst = level === 0
                  const isLast = level === 5

                  if (isActive) {
                    return (
                      <span
                        key={levelKey}
                        className={cn(
                          "relative z-10 inline-flex shrink-0 items-center justify-center rounded-[5px] font-bold text-white shadow-sm",
                          isFirst && "mr-0.5 rounded-l rounded-r-none",
                          isLast && "ml-0.5 rounded-l-none rounded-r",
                          !isFirst && !isLast && "mx-0.5",
                          levelConfig.bgClass,
                          s.activePill,
                        )}
                      >
                        {level}
                      </span>
                    )
                  }

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

              {showLabel && <span className={cn("font-medium", s.label)}>{config.description}</span>}
            </div>

            {showDescription && (
              <span className={cn("text-muted-foreground text-xs font-normal", s.label)}>{config.explanation}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" sideOffset={6} alignOffset={-6}>
          <p className="font-semibold">{config.description}</p>
          {config.explanation}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
