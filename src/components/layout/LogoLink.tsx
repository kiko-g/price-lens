"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { useBrand } from "@/contexts/BrandContext"
import { LinceMark } from "@/components/icons/LinceMark"

type LogoLinkProps = {
  className?: string
  /** Hide the wordmark (e.g. collapsed sidebar rail). */
  markOnly?: boolean
  /** Show the small-caps eyebrow under the wordmark (sidebar header). */
  withEyebrow?: boolean
  markClassName?: string
}

export function LogoLink({ className, markOnly = false, withEyebrow = false, markClassName }: LogoLinkProps) {
  const brand = useBrand()

  return (
    <Link
      href="/"
      aria-label={brand.displayName}
      className={cn("flex max-w-full min-w-0 items-center gap-2.5 transition hover:opacity-80", className)}
    >
      <LinceMark
        logoShape="pal"
        logoFashion="filled"
        pulseShapePattern="quarter-circle"
        pulseAnimation="static"
        className={cn("logo-animation size-7 shrink-0", markClassName)}
      />
      {!markOnly && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[17px] font-bold tracking-tight">{brand.displayName}</span>
          {withEyebrow && <span className="eyebrow text-primary mt-1 truncate">{brand.eyebrowText}</span>}
        </span>
      )}
    </Link>
  )
}
