"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { useBrand } from "@/contexts/BrandContext"

type LogoLinkProps = {
  className?: string
  /** Hide the wordmark (e.g. collapsed sidebar rail). */
  markOnly?: boolean
}

export function LogoLink({ className, markOnly = false }: LogoLinkProps) {
  const brand = useBrand()

  return (
    <Link
      href="/"
      aria-label={brand.displayName}
      className={cn(
        "flex max-w-full min-w-0 items-center justify-start gap-1.5 transition hover:opacity-80 md:justify-center",
        className,
      )}
    >
      <span className="flex shrink-0 items-center justify-center rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.markSrc} alt="" className="logo-animation size-5" />
      </span>
      {!markOnly && <span className="truncate font-bold tracking-tight">{brand.displayName}</span>}
    </Link>
  )
}
