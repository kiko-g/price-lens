"use client"

import type { DealSummaryTier } from "@/lib/business/product-deal-summary"
import { cn } from "@/lib/utils"

type Props = {
  tier: DealSummaryTier
  className?: string
}

/** Subtle radial highlights (magicui-style) — CSS only, no layout shift. */
export function DealSummaryLightRays({ tier, className }: Props) {
  const tint =
    tier === "habitual"
      ? "[--ray-a:rgba(34,197,94,0.14)] [--ray-b:rgba(34,197,94,0.06)]"
      : tier === "infrequent"
        ? "[--ray-a:rgba(245,158,11,0.16)] [--ray-b:rgba(245,158,11,0.07)]"
        : tier === "middle"
          ? "[--ray-a:rgba(59,130,246,0.12)] [--ray-b:rgba(59,130,246,0.05)]"
          : "[--ray-a:rgba(148,163,184,0.12)] [--ray-b:rgba(148,163,184,0.05)]"

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        tint,
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-90 dark:opacity-100"
        style={{
          background: `
            radial-gradient(ellipse 85% 55% at 90% -15%, var(--ray-a), transparent 52%),
            radial-gradient(ellipse 70% 45% at 5% 105%, var(--ray-b), transparent 50%)
          `,
        }}
      />
      <div
        className="absolute inset-[-40%] animate-deal-summary-rays opacity-40 dark:opacity-35"
        style={{
          background: `conic-gradient(from 210deg at 50% 50%, transparent 0deg, var(--ray-a) 28deg, transparent 56deg, transparent 180deg, var(--ray-b) 210deg, transparent 250deg)`,
        }}
      />
    </div>
  )
}
