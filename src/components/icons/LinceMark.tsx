import { useId, type SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Lince mark — original geometric Iberian lynx (faceted head, ember ears/eyes).
 * Alert, not friendly, not a murderer: no mouth, no tear-lines, no ruff.
 *
 * Pulse and fashion are props so splash, sidebar and PWA can share one SVG.
 * Static <img>/OG/email equivalent: `public/lince-mark.svg` (tile).
 */
export const LINCE_LOGO_FASHIONS = ["filled", "filledWhite", "filledInk", "outlined", "tile"] as const
export type LinceLogoFashion = (typeof LINCE_LOGO_FASHIONS)[number]

export const LINCE_PULSE_SHAPE_PATTERNS = ["none", "quarter-circle", "half-circle", "full-circle"] as const
export type LincePulseShapePattern = (typeof LINCE_PULSE_SHAPE_PATTERNS)[number]

export const LINCE_PULSE_ANIMATIONS = ["static", "animated"] as const
export type LincePulseAnimation = (typeof LINCE_PULSE_ANIMATIONS)[number]

export type LinceMarkProps = SVGProps<SVGSVGElement> & {
  /** Facet treatment. `filled` follows the theme (white on navy, ink on paper). */
  logoFashion?: LinceLogoFashion
  /** Radar sector around the ring. Ignored for `tile`. */
  pulseShapePattern?: LincePulseShapePattern
  /** Expanding waves vs rest rings. No-op when the pattern is `none`. */
  pulseAnimation?: LincePulseAnimation
}

const TUFTS = "M17 6l2 5M47 6l-2 5"
const HEAD = "M19 11L24 23L10 29L12 38L9 45L23 50L32 59L41 50L55 45L52 38L54 29L40 23L45 11L37 19H27Z"
const EARS = "M19 11L24 23L27 19Z M45 11L40 23L37 19Z"
const FOREHEAD = "M24 23L32 27L40 23L45 33L32 30L19 33Z"
const CHEEK_L = "M19 33L32 30L27 44L12 38Z"
const CHEEK_R = "M45 33L32 30L37 44L52 38Z"
const MUZZLE = "M27 44L32 30L37 44L32 53Z"
const EYES = "M21 34L28 35L26.5 38.5Z M43 34L36 35L37.5 38.5Z"
const NOSE = "M29.5 45L34.5 45L32 48.5Z"

const QUARTER_ARC = "M32 2.5A29.5 29.5 0 0 1 61.5 32"
const HALF_ARC = "M32 2.5A29.5 29.5 0 0 1 32 61.5"
const QUARTER_CLIP = "M32 32L32 0A32 32 0 0 1 64 32Z"
const HALF_CLIP = "M32 32L32 0A32 32 0 0 1 32 64Z"

export function LinceMark({
  logoFashion = "filled",
  pulseShapePattern = "quarter-circle",
  pulseAnimation = "static",
  className,
  ...props
}: LinceMarkProps) {
  const reactId = useId()
  const clipId = `lince-pulse-clip-${reactId.replace(/:/g, "")}`
  const showPulse = logoFashion !== "tile" && pulseShapePattern !== "none"
  const effectivePattern = showPulse ? pulseShapePattern : "none"
  const effectiveAnimation = showPulse ? pulseAnimation : "static"

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      data-logo-fashion={logoFashion}
      data-pulse-shape-pattern={effectivePattern}
      data-pulse-animation={effectiveAnimation}
      className={cn("lince-mark overflow-visible", logoFashion === "outlined" && "text-primary", className)}
      {...props}
    >
      {logoFashion !== "tile" && pulseShapePattern !== "none" ? (
        <PulseLayer pattern={pulseShapePattern} animation={pulseAnimation} clipId={clipId} />
      ) : null}
      <LinceHead fashion={logoFashion} />
    </svg>
  )
}

function PulseLayer({
  pattern,
  animation,
  clipId,
}: {
  pattern: Exclude<LincePulseShapePattern, "none">
  animation: LincePulseAnimation
  clipId: string
}) {
  const clipPathD = pattern === "quarter-circle" ? QUARTER_CLIP : pattern === "half-circle" ? HALF_CLIP : null
  const arcD = pattern === "quarter-circle" ? QUARTER_ARC : pattern === "half-circle" ? HALF_ARC : null

  return (
    <>
      {clipPathD ? (
        <defs>
          <clipPath id={clipId}>
            <path d={clipPathD} />
          </clipPath>
        </defs>
      ) : null}

      <circle cx={32} cy={32} r={29.5} className="stroke-primary/30" strokeWidth={1.4} />
      {arcD ? (
        <path
          d={arcD}
          className="stroke-primary drop-shadow-[0_0_5px_var(--primary)]"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : (
        <circle
          cx={32}
          cy={32}
          r={29.5}
          className="stroke-primary/70 drop-shadow-[0_0_5px_var(--primary)]"
          strokeWidth={1.8}
        />
      )}

      <g clipPath={clipPathD ? `url(#${clipId})` : undefined} data-lince-pulse-waves="">
        {animation === "animated" ? (
          <>
            <circle cx={32} cy={32} r={31} className="lince-pulse-wave lince-pulse-wave-1" strokeWidth={1.2} />
            <circle cx={32} cy={32} r={31} className="lince-pulse-wave lince-pulse-wave-2" strokeWidth={1.2} />
            <circle cx={32} cy={32} r={31} className="lince-pulse-wave lince-pulse-wave-3" strokeWidth={1.2} />
          </>
        ) : (
          <>
            <circle cx={32} cy={32} r={32.5} className="stroke-primary/40" strokeWidth={1.1} />
            <circle cx={32} cy={32} r={36} className="stroke-primary/22" strokeWidth={1} />
            <circle cx={32} cy={32} r={39.5} className="stroke-primary/10" strokeWidth={0.9} />
          </>
        )}
      </g>
    </>
  )
}

function LinceHead({ fashion }: { fashion: LinceLogoFashion }) {
  if (fashion === "outlined") {
    return (
      <>
        <path d={TUFTS} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        <path
          d={HEAD}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_var(--primary)]"
        />
        <path d="M24 23L32 27L40 23" stroke="currentColor" strokeWidth={1.2} strokeOpacity={0.7} />
        <path d={EYES} fill="currentColor" />
      </>
    )
  }

  if (fashion === "tile") {
    return (
      <>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <path d={TUFTS} className="stroke-primary" strokeWidth={1.6} strokeLinecap="round" />
        <path d={HEAD} className="fill-primary" />
        <path d={EARS} className="fill-primary-200" />
        <path d={FOREHEAD} className="fill-primary-700" />
        <path d={MUZZLE} className="fill-primary-400" />
        <path d={EYES} className="fill-base-950" />
        <path d={NOSE} className="fill-base-950" />
      </>
    )
  }

  if (fashion === "filledWhite") {
    return (
      <FacetedHead tufts="#e8ebf2" head="#e8ebf2" forehead="#c9ced9" cheek="#dfe3ec" muzzle="#f4f6fa" nose="#0b0f1a" />
    )
  }

  if (fashion === "filledInk") {
    return (
      <FacetedHead tufts="#14181f" head="#14181f" forehead="#2a3040" cheek="#1c2230" muzzle="#3b4150" nose="#f6f3ee" />
    )
  }

  return (
    <>
      <path d={TUFTS} className="stroke-foreground" strokeWidth={1.6} strokeLinecap="round" />
      <path d={HEAD} className="fill-foreground" />
      <path d={EARS} className="fill-primary" />
      <path d={FOREHEAD} className="fill-black/20" />
      <path d={CHEEK_L} className="fill-black/10" />
      <path d={CHEEK_R} className="fill-black/10" />
      <path d={MUZZLE} className="fill-white/15" />
      <path d={EYES} className="fill-primary" />
      <path d={NOSE} className="fill-background" />
    </>
  )
}

function FacetedHead({
  tufts,
  head,
  forehead,
  cheek,
  muzzle,
  nose,
}: {
  tufts: string
  head: string
  forehead: string
  cheek: string
  muzzle: string
  nose: string
}) {
  return (
    <>
      <path d={TUFTS} stroke={tufts} strokeWidth={1.6} strokeLinecap="round" />
      <path d={HEAD} fill={head} />
      <path d={EARS} className="fill-primary" />
      <path d={FOREHEAD} fill={forehead} />
      <path d={CHEEK_L} fill={cheek} />
      <path d={CHEEK_R} fill={cheek} />
      <path d={MUZZLE} fill={muzzle} />
      <path d={EYES} className="fill-primary" />
      <path d={NOSE} fill={nose} />
    </>
  )
}
