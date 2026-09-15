import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Lince mark — flat, perk-style Iberian lynx head (wide ruff, short tufted ears, slit eyes) inside a
 * pulse ring. Theme-aware: head follows `foreground`, accents follow `primary`, so it works on paper
 * and on navy. Static equivalent for <img>/OG/email is `public/lince-mark.svg` (tile variant).
 */
type LinceMarkProps = SVGProps<SVGSVGElement> & {
  variant?: "ring" | "head" | "outline" | "tile"
}

const HEAD =
  "M15.5 13.5L23 21Q32 17.5 41 21L48.5 13.5L46 26L55 29L50 37L53 45L43 47L38 55L32 51L26 55L21 47L11 45L14 37L9 29L18 26Z"
const RUFF = "M9 29L18 26L14 37Z M55 29L46 26L50 37Z M14 37L21 47L11 45Z M50 37L43 47L53 45Z"
const EYES = "M19.5 31L27.5 30L28 34L21.5 35.5Z M44.5 31L36.5 30L36 34L42.5 35.5Z"
const TEAR_LINES = "M27 35.5L29.5 42L31 41Z M37 35.5L34.5 42L33 41Z"
const NOSE = "M29 44L35 44L32 48Z"
const MOUTH = "M32 48L32 50M32 50L28.5 52.5M32 50L35.5 52.5"
const TUFTS = "M15.5 13.5L13 9.5M48.5 13.5L51 9.5"

export function LinceMark({ variant = "ring", className, ...props }: LinceMarkProps) {
  if (variant === "outline") {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn("text-primary", className)} {...props}>
        <path d={TUFTS} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
        <path
          d={HEAD}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_currentColor]"
        />
        <path d={EYES} fill="currentColor" />
        <path d={NOSE} fill="currentColor" />
      </svg>
    )
  }

  if (variant === "tile") {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className={className} {...props}>
        <rect width={64} height={64} className="fill-base-900" />
        <rect x={0.5} y={0.5} width={63} height={63} className="stroke-base-700" />
        <path d="M4 22L18 26L14 44L4 46Z M60 22L46 26L50 44L60 46Z" className="fill-primary-900" />
        <path d={TUFTS} className="stroke-foreground" strokeWidth={1.7} strokeLinecap="round" />
        <path d={HEAD} className="fill-foreground" />
        <path d={RUFF} className="fill-foreground/80" />
        <path d={EYES} className="fill-primary" />
        <path d={TEAR_LINES} className="fill-base-900" />
        <path d={NOSE} className="fill-base-900" />
        <path d={MOUTH} className="stroke-base-900" strokeWidth={1.4} strokeLinecap="round" />
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
      <path d={TUFTS} className="stroke-foreground" strokeWidth={1.7} strokeLinecap="round" />
      <path d={HEAD} className="fill-foreground" />
      <path d={RUFF} className="fill-foreground/80" />
      <path d={EYES} className="fill-primary" />
      <path d={TEAR_LINES} className="fill-background" />
      <path d={NOSE} className="fill-background" />
      <path d={MOUTH} className="stroke-background" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  )
}
