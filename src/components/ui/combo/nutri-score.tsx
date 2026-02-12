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
}

export function NutriScoreBadge({ grade, showNewCalculation = true, className, size = 1 }: NutriScoreBadgeProps) {
  return (
    <div
      className={cn("inline-flex shrink-0 flex-col items-center", className)}
      role="img"
      aria-label={`Nutri-Score ${grade}`}
      style={{ fontSize: `${size}rem` }}
    >
      {/* NUTRI-SCORE header */}
      <span className="mb-[0.2em] text-[1.05em] leading-none font-extrabold tracking-wide" style={{ color: "#2d2d2d" }}>
        NUTRI-SCORE
      </span>

      {/* Grade pills row */}
      <div className="relative flex items-center">
        {GRADES.map((g) => {
          const isActive = g === grade
          const color = GRADE_COLORS[g]

          if (isActive) {
            return (
              <div
                key={g}
                className="relative z-10 flex items-center justify-center rounded-full font-bold text-white shadow-md"
                style={{
                  backgroundColor: color,
                  width: "2.6em",
                  height: "2.6em",
                  fontSize: "1.1em",
                  margin: "0 -0.1em",
                }}
              >
                <span style={{ fontSize: "1.3em", lineHeight: 1 }}>{g}</span>
              </div>
            )
          }

          return (
            <div
              key={g}
              className="flex items-center justify-center font-bold"
              style={{
                backgroundColor: color,
                width: "2em",
                height: "2em",
                fontSize: "1em",
                color: "rgba(255,255,255,0.65)",
                borderRadius:
                  g === "A" && grade !== "A"
                    ? "0.25em 0 0 0.25em"
                    : g === "E" && grade !== "E"
                      ? "0 0.25em 0.25em 0"
                      : "0",
              }}
            >
              <span style={{ fontSize: "0.95em", lineHeight: 1 }}>{g}</span>
            </div>
          )
        })}
      </div>

      {/* NEW CALCULATION footer */}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full section component (badge + label + description inside a tinted card)
// ---------------------------------------------------------------------------
interface NutriScoreProps {
  grade: NutriScoreGrade
  showNewCalculation?: boolean
  className?: string
}

export function NutriScore({ grade, showNewCalculation = true, className }: NutriScoreProps) {
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
