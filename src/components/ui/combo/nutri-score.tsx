import { cn } from "@/lib/utils"

type NutriScoreGrade = "A" | "B" | "C" | "D" | "E"

const GRADE_COLORS: Record<NutriScoreGrade, string> = {
  A: "#038141",
  B: "#85BB2F",
  C: "#FECB02",
  D: "#EE8100",
  E: "#E63E11",
}

const GRADE_DESCRIPTIONS: Record<NutriScoreGrade, { label: string; description: string; cardBg: string }> = {
  A: {
    label: "Nutri-Score A",
    description: "Excellent nutritional quality",
    cardBg: "rgba(3, 129, 65, 0.08)",
  },
  B: {
    label: "Nutri-Score B",
    description: "Good nutritional quality",
    cardBg: "rgba(133, 187, 47, 0.08)",
  },
  C: {
    label: "Nutri-Score C",
    description: "Average nutritional quality",
    cardBg: "rgba(254, 203, 2, 0.08)",
  },
  D: {
    label: "Nutri-Score D",
    description: "Poor nutritional quality",
    cardBg: "rgba(238, 129, 0, 0.08)",
  },
  E: {
    label: "Nutri-Score E",
    description: "Lower nutritional quality",
    cardBg: "rgba(230, 62, 17, 0.08)",
  },
}

const GRADES: NutriScoreGrade[] = ["A", "B", "C", "D", "E"]

// ---------------------------------------------------------------------------
// Badge-only component
// ---------------------------------------------------------------------------
interface NutriScoreBadgeProps {
  grade: NutriScoreGrade
  showNewCalculation?: boolean
  className?: string
  /** Controls badge scale. Default is 1. */
  size?: number
  /** When false, renders with a rounded border and inner padding (official logo style). Default true. */
  compact?: boolean
}

export function NutriScoreBadge({
  grade,
  showNewCalculation = true,
  className,
  size = 1,
  compact = true,
}: NutriScoreBadgeProps) {
  const content = (
    <>
      <span className="mb-[0.15em] text-[1em] leading-none font-extrabold tracking-wider text-[#7b7b7b] dark:text-neutral-300">
        NUTRI-SCORE
      </span>

      <div className="relative flex items-center">
        {GRADES.map((g) => {
          const isActive = g === grade
          const color = GRADE_COLORS[g]

          if (isActive) {
            return (
              <div
                key={g}
                className="relative z-10 flex items-center justify-center font-bold text-white"
                style={{
                  backgroundColor: color,
                  width: "2.2em",
                  height: "2.8em",
                  borderRadius: "1.1em",
                  margin: "0 -0.05em",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                }}
              >
                <span style={{ fontSize: "1.35em", lineHeight: 1 }}>{g}</span>
              </div>
            )
          }

          return (
            <div
              key={g}
              className="flex items-center justify-center font-bold"
              style={{
                backgroundColor: color,
                width: "1.85em",
                height: "1.85em",
                color: "rgba(255,255,255,0.55)",
                borderRadius:
                  g === "A" && grade !== "A"
                    ? "0.25em 0 0 0.25em"
                    : g === "E" && grade !== "E"
                      ? "0 0.25em 0.25em 0"
                      : "0",
              }}
            >
              <span style={{ fontSize: "0.9em", lineHeight: 1 }}>{g}</span>
            </div>
          )
        })}
      </div>

      {showNewCalculation && (
        <div
          className="mt-[-0.15em] flex items-center justify-center rounded-b-lg"
          style={{
            backgroundColor: "#1b3260",
            width: "100%",
            paddingTop: "0.3em",
            paddingBottom: "0.25em",
            paddingLeft: "0.4em",
            paddingRight: "0.4em",
          }}
        >
          <span
            className="font-extrabold tracking-wider text-white uppercase"
            style={{ fontSize: "0.6em", lineHeight: 1 }}
          >
            New Calculation
          </span>
        </div>
      )}
    </>
  )

  return (
    <div
      className={cn(
        "inline-flex shrink-0 flex-col items-center",
        !compact &&
          "border-border bg-foreground/2 dark:border-border dark:bg-foreground/5 rounded-2xl border-2 px-[0.8em] pt-[0.65em] pb-[0.55em]",
        className,
      )}
      role="img"
      aria-label={`Nutri-Score ${grade}`}
      style={{ fontSize: `${size}rem` }}
    >
      {content}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full section component (badge + label + description inside a tinted card)
// ---------------------------------------------------------------------------
interface NutriScoreCalloutProps {
  grade: NutriScoreGrade
  showNewCalculation?: boolean
  className?: string
}

export function NutriScoreCallout({ grade, showNewCalculation = true, className }: NutriScoreCalloutProps) {
  const info = GRADE_DESCRIPTIONS[grade]
  const color = GRADE_COLORS[grade]

  return (
    <div
      className={cn("flex items-center gap-5 rounded-xl px-5 py-4", className)}
      style={{ backgroundColor: info.cardBg }}
      role="status"
      aria-label={`${info.label}: ${info.description}`}
    >
      <NutriScoreBadge grade={grade} showNewCalculation={showNewCalculation} size={0.85} />

      <div className="flex flex-col gap-0.5">
        <span className="text-lg font-semibold" style={{ color }}>
          {info.label}
        </span>
        <span className="text-foreground/70 text-sm">{info.description}</span>
      </div>
    </div>
  )
}
