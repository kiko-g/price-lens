import { useId, type SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Lince mark — Iberian lynx with a pulse ring.
 *
 * `pal` is the sellable default: shield head, scan-eyes, ears as tufts.
 * `angular` is the sharp faceted variant (kept for the lab).
 * Static <img>/OG/email equivalent: `public/lince-mark.svg` (tile + pal).
 */
export const LINCE_LOGO_SHAPES = ["pal", "angular"] as const
export type LinceLogoShape = (typeof LINCE_LOGO_SHAPES)[number]

export const LINCE_LOGO_FASHIONS = ["filled", "filledWhite", "filledInk", "outlined", "tile"] as const
export type LinceLogoFashion = (typeof LINCE_LOGO_FASHIONS)[number]

export const LINCE_PULSE_SHAPE_PATTERNS = ["none", "quarter-circle", "half-circle", "full-circle"] as const
export type LincePulseShapePattern = (typeof LINCE_PULSE_SHAPE_PATTERNS)[number]

export const LINCE_PULSE_ANIMATIONS = ["static", "animated"] as const
export type LincePulseAnimation = (typeof LINCE_PULSE_ANIMATIONS)[number]

export type LinceMarkProps = SVGProps<SVGSVGElement> & {
  /** Silhouette. `pal` is the product default; `angular` is the sharp cut. */
  logoShape?: LinceLogoShape
  /** Facet treatment. `filled` follows the theme (white on navy, ink on paper). */
  logoFashion?: LinceLogoFashion
  /** Radar sector around the ring. Ignored for `tile`. */
  pulseShapePattern?: LincePulseShapePattern
  /** Expanding waves vs rest rings. No-op when the pattern is `none`. */
  pulseAnimation?: LincePulseAnimation
}

const ANGULAR = {
  tufts: "M17 6l2 5M47 6l-2 5",
  head: "M19 11L24 23L10 29L12 38L9 45L23 50L32 59L41 50L55 45L52 38L54 29L40 23L45 11L37 19H27Z",
  ears: "M19 11L24 23L27 19Z M45 11L40 23L37 19Z",
  forehead: "M24 23L32 27L40 23L45 33L32 30L19 33Z",
  cheekL: "M19 33L32 30L27 44L12 38Z",
  cheekR: "M45 33L32 30L37 44L52 38Z",
  muzzle: "M27 44L32 30L37 44L32 53Z",
  eyes: "M21 34L28 35L26.5 38.5Z M43 34L36 35L37.5 38.5Z",
  brow: "M24 23L32 27L40 23",
  nose: "M29.5 45L34.5 45L32 48.5Z",
}

const PAL = {
  head: "M18 5L21 17L16 25L15 39L23 50L28 53.5L32 54.5L36 53.5L41 50L49 39L48 25L43 17L46 5L35 16L29 16Z",
  innerL: "M21.2 15.5L19.4 8L27.5 15.2Z",
  innerR: "M42.8 15.5L44.6 8L36.5 15.2Z",
  forehead: "M23 21L32 24L41 21L42.5 29L32 27L21.5 29Z",
  cheekL: "M16 33L30 31L25 43L15 39Z",
  cheekR: "M48 33L34 31L39 43L49 39Z",
  muzzle: "M26 41L32 36L38 41L32 49Z",
  brow: "M23 21L32 24L41 21",
  nose: "M29.8 43.2L34.2 43.2L32 46Z",
  eyes: [
    { cx: 23.3, cy: 31.6, rx: 4.4, ry: 3.9 },
    { cx: 40.7, cy: 31.6, rx: 4.4, ry: 3.9 },
  ] as const,
}

const QUARTER_ARC = "M32 2.5A29.5 29.5 0 0 1 61.5 32"
const HALF_ARC = "M32 2.5A29.5 29.5 0 0 1 32 61.5"
const QUARTER_CLIP = "M32 32L32 0A32 32 0 0 1 64 32Z"
const HALF_CLIP = "M32 32L32 0A32 32 0 0 1 32 64Z"

export function LinceMark({
  logoShape = "pal",
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
      data-logo-shape={logoShape}
      data-logo-fashion={logoFashion}
      data-pulse-shape-pattern={effectivePattern}
      data-pulse-animation={effectiveAnimation}
      className={cn("lince-mark overflow-visible", logoFashion === "outlined" && "text-primary", className)}
      {...props}
    >
      {logoFashion !== "tile" && pulseShapePattern !== "none" ? (
        <PulseLayer pattern={pulseShapePattern} animation={pulseAnimation} clipId={clipId} />
      ) : null}
      {logoShape === "pal" ? <PalHead fashion={logoFashion} /> : <AngularHead fashion={logoFashion} />}
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

function PalHead({ fashion }: { fashion: LinceLogoFashion }) {
  if (fashion === "outlined") {
    return (
      <>
        <path
          d={PAL.head}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_var(--primary)]"
        />
        <path d={PAL.brow} stroke="currentColor" strokeWidth={1.2} strokeOpacity={0.7} />
        <ScanEyes wellClass="fill-background" irisFill="currentColor" />
      </>
    )
  }

  if (fashion === "tile") {
    return (
      <>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <path d={PAL.head} className="fill-primary" />
        <path d={PAL.innerL} className="fill-primary-200" />
        <path d={PAL.innerR} className="fill-primary-200" />
        <path d={PAL.forehead} className="fill-primary-700" />
        <path d={PAL.muzzle} className="fill-primary-400" />
        <ScanEyes wellClass="fill-base-950" irisClass="fill-primary-200" />
        <path d={PAL.nose} className="fill-base-950" />
      </>
    )
  }

  if (fashion === "filledWhite") {
    return (
      <PalFacets head="#e8ebf2" forehead="#c9ced9" cheek="#dfe3ec" muzzle="#f4f6fa" nose="#0b0f1a" well="#0b0f1a" />
    )
  }

  if (fashion === "filledInk") {
    return (
      <PalFacets head="#14181f" forehead="#2a3040" cheek="#1c2230" muzzle="#3b4150" nose="#f6f3ee" well="#0b0f1a" />
    )
  }

  return (
    <>
      <path d={PAL.head} className="fill-foreground" />
      <path d={PAL.innerL} className="fill-primary" />
      <path d={PAL.innerR} className="fill-primary" />
      <path d={PAL.forehead} className="fill-black/20" />
      <path d={PAL.cheekL} className="fill-black/10" />
      <path d={PAL.cheekR} className="fill-black/10" />
      <path d={PAL.muzzle} className="fill-white/15" />
      <ScanEyes wellClass="fill-base-950" irisClass="fill-primary" />
      <path d={PAL.nose} className="fill-background" />
    </>
  )
}

function PalFacets({
  head,
  forehead,
  cheek,
  muzzle,
  nose,
  well,
}: {
  head: string
  forehead: string
  cheek: string
  muzzle: string
  nose: string
  well: string
}) {
  return (
    <>
      <path d={PAL.head} fill={head} />
      <path d={PAL.innerL} className="fill-primary" />
      <path d={PAL.innerR} className="fill-primary" />
      <path d={PAL.forehead} fill={forehead} />
      <path d={PAL.cheekL} fill={cheek} />
      <path d={PAL.cheekR} fill={cheek} />
      <path d={PAL.muzzle} fill={muzzle} />
      <ScanEyes wellFill={well} irisClass="fill-primary" />
      <path d={PAL.nose} fill={nose} />
    </>
  )
}

function ScanEyes({
  wellClass,
  wellFill,
  irisClass,
  irisFill,
}: {
  wellClass?: string
  wellFill?: string
  irisClass?: string
  irisFill?: string
}) {
  return (
    <>
      {PAL.eyes.map((eye) => (
        <g key={`${eye.cx}-${eye.cy}`}>
          <ellipse cx={eye.cx} cy={eye.cy} rx={eye.rx} ry={eye.ry} className={wellClass} fill={wellFill} />
          <ellipse
            cx={eye.cx}
            cy={eye.cy}
            rx={eye.rx}
            ry={eye.ry}
            fill="none"
            className="stroke-primary"
            strokeWidth={1.25}
          />
          <ellipse
            cx={eye.cx}
            cy={eye.cy}
            rx={eye.rx * 0.52}
            ry={eye.ry * 0.55}
            className={irisClass}
            fill={irisFill}
          />
          <circle cx={eye.cx - 1.15} cy={eye.cy - 1.15} r={0.8} fill="#f4f6fa" />
        </g>
      ))}
    </>
  )
}

function AngularHead({ fashion }: { fashion: LinceLogoFashion }) {
  if (fashion === "outlined") {
    return (
      <>
        <path d={ANGULAR.tufts} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        <path
          d={ANGULAR.head}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_var(--primary)]"
        />
        <path d={ANGULAR.brow} stroke="currentColor" strokeWidth={1.2} strokeOpacity={0.7} />
        <path d={ANGULAR.eyes} fill="currentColor" />
      </>
    )
  }

  if (fashion === "tile") {
    return (
      <>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <path d={ANGULAR.tufts} className="stroke-primary" strokeWidth={1.6} strokeLinecap="round" />
        <path d={ANGULAR.head} className="fill-primary" />
        <path d={ANGULAR.ears} className="fill-primary-200" />
        <path d={ANGULAR.forehead} className="fill-primary-700" />
        <path d={ANGULAR.muzzle} className="fill-primary-400" />
        <path d={ANGULAR.eyes} className="fill-base-950" />
        <path d={ANGULAR.nose} className="fill-base-950" />
      </>
    )
  }

  if (fashion === "filledWhite") {
    return (
      <AngularFacets
        tufts="#e8ebf2"
        head="#e8ebf2"
        forehead="#c9ced9"
        cheek="#dfe3ec"
        muzzle="#f4f6fa"
        nose="#0b0f1a"
      />
    )
  }

  if (fashion === "filledInk") {
    return (
      <AngularFacets
        tufts="#14181f"
        head="#14181f"
        forehead="#2a3040"
        cheek="#1c2230"
        muzzle="#3b4150"
        nose="#f6f3ee"
      />
    )
  }

  return (
    <>
      <path d={ANGULAR.tufts} className="stroke-foreground" strokeWidth={1.6} strokeLinecap="round" />
      <path d={ANGULAR.head} className="fill-foreground" />
      <path d={ANGULAR.ears} className="fill-primary" />
      <path d={ANGULAR.forehead} className="fill-black/20" />
      <path d={ANGULAR.cheekL} className="fill-black/10" />
      <path d={ANGULAR.cheekR} className="fill-black/10" />
      <path d={ANGULAR.muzzle} className="fill-white/15" />
      <path d={ANGULAR.eyes} className="fill-primary" />
      <path d={ANGULAR.nose} className="fill-background" />
    </>
  )
}

function AngularFacets({
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
      <path d={ANGULAR.tufts} stroke={tufts} strokeWidth={1.6} strokeLinecap="round" />
      <path d={ANGULAR.head} fill={head} />
      <path d={ANGULAR.ears} className="fill-primary" />
      <path d={ANGULAR.forehead} fill={forehead} />
      <path d={ANGULAR.cheekL} fill={cheek} />
      <path d={ANGULAR.cheekR} fill={cheek} />
      <path d={ANGULAR.muzzle} fill={muzzle} />
      <path d={ANGULAR.eyes} className="fill-primary" />
      <path d={ANGULAR.nose} fill={nose} />
    </>
  )
}
