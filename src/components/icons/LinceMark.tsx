import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Lince mark — faceted Iberian lynx head inside a pulse ring.
 * Theme-aware (head follows `foreground`, accents follow `primary`), so it works on paper and navy.
 * The static equivalent for <img>/OG/email is `public/lince-mark.svg` (tile variant).
 */
type LinceMarkProps = SVGProps<SVGSVGElement> & {
  variant?: "ring" | "head" | "outline" | "tile"
}

const HEAD = "M19 11L24 23L10 29L12 38L9 45L23 50L32 59L41 50L55 45L52 38L54 29L40 23L45 11L37 19H27Z"
const EARS = "M19 11L24 23L27 19Z M45 11L40 23L37 19Z"
const FOREHEAD = "M24 23L32 27L40 23L45 33L32 30L19 33Z"
const CHEEK_L = "M19 33L32 30L27 44L12 38Z"
const CHEEK_R = "M45 33L32 30L37 44L52 38Z"
const MUZZLE = "M27 44L32 30L37 44L32 53Z"
const EYES = "M21 34L28 35L26.5 38.5Z M43 34L36 35L37.5 38.5Z"
const NOSE = "M29.5 45L34.5 45L32 48.5Z"
const TUFTS = "M17 6l2 5M47 6l-2 5"

export function LinceMark({ variant = "ring", className, ...props }: LinceMarkProps) {
  if (variant === "outline") {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn("text-primary", className)} {...props}>
        <path d={TUFTS} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        <path
          d={HEAD}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_currentColor]"
        />
        <path d="M24 23L32 27L40 23" stroke="currentColor" strokeWidth={1.2} strokeOpacity={0.7} />
        <path d={EYES} fill="currentColor" />
      </svg>
    )
  }

  if (variant === "tile") {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className} {...props}>
        <path d="M6 0H58L64 6V58L58 64H6L0 58V6Z" className="fill-base-900" />
        <path d="M6 .5H58L63.5 6V58L58 63.5H6L.5 58V6Z" className="stroke-base-700" />
        <path d={TUFTS} className="stroke-primary" strokeWidth={1.6} strokeLinecap="round" />
        <path d={HEAD} className="fill-primary" />
        <path d={EARS} className="fill-primary-200" />
        <path d={FOREHEAD} className="fill-primary-700" />
        <path d={MUZZLE} className="fill-primary-300" />
        <path d={EYES} className="fill-base-950" />
        <path d={NOSE} className="fill-base-950" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className} {...props}>
      {variant === "ring" && (
        <>
          <circle cx={32} cy={32} r={29.5} className="stroke-primary/30" strokeWidth={1.6} />
          <path
            d="M32 2.5A29.5 29.5 0 0 1 61.5 32"
            className="stroke-primary drop-shadow-[0_0_4px_var(--primary)]"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </>
      )}
      <path d={TUFTS} className="stroke-foreground" strokeWidth={1.6} strokeLinecap="round" />
      <path d={HEAD} className="fill-foreground" />
      <path d={EARS} className="fill-primary" />
      <path d={FOREHEAD} className="fill-foreground/75" />
      <path d={CHEEK_L} className="fill-foreground/90" />
      <path d={CHEEK_R} className="fill-foreground/90" />
      <path d={MUZZLE} className="fill-foreground" />
      <path d={EYES} className="fill-primary" />
      <path d={NOSE} className="fill-background" />
    </svg>
  )
}
