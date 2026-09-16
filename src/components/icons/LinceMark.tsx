import { useId, type SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Lince mark — Iberian lynx with a pulse ring.
 *
 * Default: `hunter` + `outlined` + quarter-circle pulse, static, with ember backlight.
 * Additional animal and geometric shapes are available in the brand studio.
 * Standalone images: `/api/brand/mark` uses the same geometry.
 */
import {
  getLinceMarkDefaults,
  type LinceMarkOptions,
  type LinceLogoFashion,
  type LincePulseShapePattern,
  type LincePulseAnimation,
} from "@/lib/brand/mark"
export {
  LINCE_LOGO_SHAPES,
  LINCE_LOGO_FASHIONS,
  LINCE_PULSE_SHAPE_PATTERNS,
  LINCE_PULSE_ANIMATIONS,
  getLinceMarkDefaults,
} from "@/lib/brand/mark"
export type {
  LinceLogoShape,
  LinceLogoFashion,
  LincePulseShapePattern,
  LincePulseAnimation,
  LinceMarkOptions,
} from "@/lib/brand/mark"

export type LinceMarkProps = SVGProps<SVGSVGElement> & Partial<LinceMarkOptions>

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

const HUNTER_HEAD = "M18 18l4 12-6 6 6 10 10 8 10-8 6-10-6-6 4-12-9 8h-10z"
const HUNTER_EYES = "M26 33l3 2-1 3z M38 33l-3 2 1 3z"
const PAL_HEAD = "M22 14L18.2 27.8A15.5 15.5 0 1 0 45.8 27.8L42 14L37.8 23.7L26.2 23.7Z"
const SIMPLE_EYES = "M25 33h5l-2 4z M34 33h5l-3 4z"
const SIMPLE_TRANSFORM = "translate(-10.6667 -13.3333) scale(1.3333)"

const QUARTER_ARC = "M32 2.5A29.5 29.5 0 0 1 61.5 32"
const HALF_ARC = "M32 2.5A29.5 29.5 0 0 1 32 61.5"
const QUARTER_CLIP = "M32 32V-16H80V32Z"
const HALF_CLIP = "M32-16H80V80H32Z"

export function LinceMark(props: LinceMarkProps) {
  const instanceId = useId()
  return <LinceMarkSvg {...props} instanceId={instanceId} />
}

/** Shared geometry for live marks and standalone brand assets. */
export function LinceMarkSvg({
  instanceId,
  logoShape = "hunter",
  logoFashion = getLinceMarkDefaults(logoShape).logoFashion,
  pulseShapePattern = getLinceMarkDefaults(logoShape).pulseShapePattern,
  pulseAnimation = "static",
  monochrome = false,
  className,
  ...props
}: LinceMarkProps & { instanceId: string }) {
  const reactId = instanceId
  const clipId = `lince-pulse-clip-${reactId.replace(/:/g, "")}`
  const maskId = `lince-ink-mask-${reactId.replace(/:/g, "")}`
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
      data-monochrome={monochrome}
      className={cn(
        "lince-mark overflow-visible",
        monochrome ? "text-foreground" : logoFashion === "outlined" && "text-primary",
        monochrome && (logoFashion === "filledWhite" || logoFashion === "tile") && "text-[#e8ebf2]",
        monochrome && logoFashion === "filledInk" && "text-[#14181f]",
        className,
      )}
      {...props}
    >
      {logoFashion !== "tile" && pulseShapePattern !== "none" ? (
        <PulseLayer pattern={pulseShapePattern} animation={pulseAnimation} clipId={clipId} monochrome={monochrome} />
      ) : null}
      {logoShape === "geometric-1" ? (
        <GeometricMark fashion={logoFashion} monochrome={monochrome} />
      ) : logoShape === "simple" ? (
        <SimpleHead fashion={logoFashion} monochrome={monochrome} />
      ) : monochrome ? (
        <MonochromeHead shape={logoShape} fashion={logoFashion} maskId={maskId} />
      ) : logoShape === "hunter" ? (
        <HunterHead fashion={logoFashion} />
      ) : logoShape === "pal" ? (
        <PalHead fashion={logoFashion} />
      ) : (
        <AngularHead fashion={logoFashion} />
      )}
    </svg>
  )
}

function PulseLayer({
  pattern,
  animation,
  clipId,
  monochrome,
}: {
  pattern: Exclude<LincePulseShapePattern, "none">
  animation: LincePulseAnimation
  clipId: string
  monochrome: boolean
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

      <circle
        cx={32}
        cy={32}
        r={29.5}
        className={monochrome ? "stroke-current/30" : "stroke-primary/30"}
        strokeWidth={1.4}
      />
      {arcD ? (
        <path
          d={arcD}
          className={monochrome ? "stroke-current" : "stroke-primary drop-shadow-[0_0_5px_var(--primary)]"}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : (
        <circle
          cx={32}
          cy={32}
          r={29.5}
          className={monochrome ? "stroke-current/70" : "stroke-primary/70 drop-shadow-[0_0_5px_var(--primary)]"}
          strokeWidth={1.8}
        />
      )}

      <g clipPath={clipPathD ? `url(#${clipId})` : undefined} data-lince-pulse-waves="">
        {animation === "animated" ? (
          <>
            <circle
              cx={32}
              cy={32}
              r={31}
              className={cn("lince-pulse-wave lince-pulse-wave-1", monochrome && "stroke-current")}
              strokeWidth={1.2}
            />
            <circle
              cx={32}
              cy={32}
              r={31}
              className={cn("lince-pulse-wave lince-pulse-wave-2", monochrome && "stroke-current")}
              strokeWidth={1.2}
            />
            <circle
              cx={32}
              cy={32}
              r={31}
              className={cn("lince-pulse-wave lince-pulse-wave-3", monochrome && "stroke-current")}
              strokeWidth={1.2}
            />
          </>
        ) : (
          <>
            <circle
              cx={32}
              cy={32}
              r={32.5}
              className={monochrome ? "stroke-current/40" : "stroke-primary/40"}
              strokeWidth={1.1}
            />
            <circle
              cx={32}
              cy={32}
              r={36}
              className={monochrome ? "stroke-current/22" : "stroke-primary/22"}
              strokeWidth={1}
            />
            <circle
              cx={32}
              cy={32}
              r={39.5}
              className={monochrome ? "stroke-current/10" : "stroke-primary/10"}
              strokeWidth={0.9}
            />
          </>
        )}
      </g>
    </>
  )
}

function TileBackground() {
  return <rect width={64} height={64} fill="#0b0f1a" />
}

function flatInk(fashion: LinceLogoFashion) {
  if (fashion === "filledWhite" || fashion === "tile") return "#e8ebf2"
  if (fashion === "filledInk") return "#14181f"
  return "var(--foreground)"
}

function SimpleHead({ fashion, monochrome }: { fashion: LinceLogoFashion; monochrome: boolean }) {
  const ink = monochrome ? "currentColor" : flatInk(fashion)
  return (
    <>
      {fashion === "tile" && <TileBackground />}
      <g transform={SIMPLE_TRANSFORM} data-lince-simple="">
        {fashion === "outlined" ? (
          <>
            <path d={HUNTER_HEAD} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
            <path d={SIMPLE_EYES} fill={ink} />
          </>
        ) : (
          <path d={`${HUNTER_HEAD} ${SIMPLE_EYES}`} fill={ink} fillRule="evenodd" />
        )}
      </g>
    </>
  )
}

function GeometricMark({ fashion, monochrome }: { fashion: LinceLogoFashion; monochrome: boolean }) {
  const ink = monochrome ? "currentColor" : flatInk(fashion)
  return (
    <>
      {fashion === "tile" && <TileBackground />}
      <g data-lince-geometric="1" strokeWidth={7} strokeLinejoin="miter">
        <path d="M12 12V52H52" stroke={ink} />
        <path d="M32 12A20 20 0 0 1 52 32" stroke={monochrome ? ink : "var(--primary)"} />
      </g>
    </>
  )
}

function MonochromeHead({
  shape,
  fashion,
  maskId,
}: {
  shape: "hunter" | "pal" | "angular"
  fashion: LinceLogoFashion
  maskId: string
}) {
  const head = shape === "hunter" ? HUNTER_HEAD : shape === "pal" ? PAL_HEAD : ANGULAR.head
  const eyes = shape === "pal" ? <PalEyes /> : <path d={shape === "hunter" ? HUNTER_EYES : ANGULAR.eyes} />
  if (fashion === "outlined") {
    return (
      <g stroke="currentColor" fill="currentColor">
        <path d={head} fill="none" strokeWidth={1.8} strokeLinejoin="round" />
        <g stroke="none">{eyes}</g>
        {shape === "angular" && <path d={ANGULAR.tufts} strokeWidth={1.6} strokeLinecap="round" />}
      </g>
    )
  }
  return (
    <>
      {fashion === "tile" && <TileBackground />}
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={64} height={64}>
          <rect width={64} height={64} fill="white" />
          <g fill="black">
            {eyes}
            {shape === "angular" && <path d={ANGULAR.nose} />}
          </g>
        </mask>
      </defs>
      <path d={head} fill="currentColor" mask={`url(#${maskId})`} />
      {shape === "angular" && <path d={ANGULAR.tufts} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />}
    </>
  )
}

function HunterHead({ fashion }: { fashion: LinceLogoFashion }) {
  if (fashion === "outlined") {
    return (
      <g className="lince-hunter-backlight">
        <path d={HUNTER_HEAD} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
        <path d={HUNTER_EYES} fill="currentColor" />
      </g>
    )
  }

  if (fashion === "tile") {
    return (
      <>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <g className="lince-hunter-backlight text-primary">
          <path d={HUNTER_HEAD} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
          <path d={HUNTER_EYES} fill="currentColor" />
        </g>
      </>
    )
  }

  if (fashion === "filledWhite") {
    return (
      <>
        <path d={HUNTER_HEAD} fill="#e8ebf2" />
        <path d={HUNTER_EYES} className="fill-primary" />
      </>
    )
  }

  if (fashion === "filledInk") {
    return (
      <>
        <path d={HUNTER_HEAD} fill="#14181f" />
        <path d={HUNTER_EYES} className="fill-primary" />
      </>
    )
  }

  return (
    <>
      <path d={HUNTER_HEAD} className="fill-foreground" />
      <path d={HUNTER_EYES} className="fill-primary" />
    </>
  )
}

function PalHead({ fashion }: { fashion: LinceLogoFashion }) {
  if (fashion === "outlined") {
    return (
      <>
        <path
          d={PAL_HEAD}
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_var(--primary)]"
        />
        <PalEyes className="fill-current" />
      </>
    )
  }

  if (fashion === "tile") {
    return (
      <>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <path d={PAL_HEAD} className="fill-primary" />
        <PalEyes className="fill-base-950" />
      </>
    )
  }

  if (fashion === "filledWhite") {
    return (
      <>
        <path d={PAL_HEAD} fill="#e8ebf2" />
        <PalEyes className="fill-primary" />
      </>
    )
  }

  if (fashion === "filledInk") {
    return (
      <>
        <path d={PAL_HEAD} fill="#14181f" />
        <PalEyes className="fill-primary" />
      </>
    )
  }

  return (
    <>
      <path d={PAL_HEAD} className="fill-foreground" />
      <PalEyes className="fill-primary" />
    </>
  )
}

function PalEyes({ className }: { className?: string }) {
  return (
    <g data-lince-pal-eyes="">
      <ellipse cx={25.6} cy={38.2} rx={3.1} ry={4.7} className={className} />
      <ellipse cx={38.4} cy={38.2} rx={3.1} ry={4.7} className={className} />
    </g>
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
