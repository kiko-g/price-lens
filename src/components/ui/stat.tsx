import Link from "next/link"

import { cn } from "@/lib/utils"

type StatProps = {
  label: string
  value: string
  /** Short delta or qualifier shown next to the value (e.g. "+12%", "hoje"). */
  delta?: string
  href?: string
  /** Decorative pulse line; pass 6–10 normalized points (0–1). */
  spark?: readonly number[]
  className?: string
}

/**
 * Lince HUD stat card: small-caps eyebrow over a large tabular number, faceted corners, ember pulse line.
 * Server-safe (no client hooks) so it can sit inside Server Components.
 */
export function Stat({ label, value, delta, href, spark, className }: StatProps) {
  const content = (
    <>
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span className="mt-2 flex items-baseline gap-2">
        <span className="text-foreground text-[28px] leading-none font-bold tracking-tight tabular-nums">{value}</span>
        {delta && <span className="text-primary text-xs font-semibold tabular-nums">{delta}</span>}
      </span>
      {spark && spark.length > 1 && <SparkLine points={spark} />}
    </>
  )

  const classes = cn(
    "hud-cut border-border bg-card/80 relative flex min-h-[92px] flex-col border px-4 py-3.5 text-left backdrop-blur-sm",
    href && "hover:border-primary/50 hover:bg-card transition-colors",
    className,
  )

  if (href) {
    return (
      <Link href={href} className={cn(classes, "group")}>
        {content}
      </Link>
    )
  }
  return <div className={classes}>{content}</div>
}

function SparkLine({ points }: { points: readonly number[] }) {
  const w = 88
  const h = 26
  const step = w / (points.length - 1)
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - Math.min(Math.max(p, 0), 1) * (h - 2) - 1).toFixed(1)}`,
    )
    .join(" ")
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      className="text-primary absolute right-3 bottom-2.5 h-[26px] w-[88px] drop-shadow-[0_0_6px_var(--primary)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

/**
 * Deterministic decorative spark shape from a number — same input, same line — so the HUD
 * stays stable across renders (no Math.random, hydration-safe).
 */
export function sparkFromValue(value: number, points = 8): number[] {
  const out: number[] = []
  let seed = Math.abs(Math.floor(value)) || 7
  for (let i = 0; i < points; i++) {
    seed = (seed * 9301 + 49297) % 233280
    const noise = seed / 233280
    out.push(Math.min(1, Math.max(0, (i / (points - 1)) * 0.6 + noise * 0.4)))
  }
  return out
}
