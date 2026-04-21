/* eslint-disable @formatjs/no-literal-string-in-jsx -- brand name is intentionally not localized */
"use client"

import Link from "next/link"

export function LogoLink() {
  return (
    <Link
      href="/"
      className="flex min-w-0 max-w-full items-center justify-start gap-1.5 transition hover:opacity-80 md:justify-center"
    >
      <span className="flex shrink-0 items-center justify-center rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/price-lens.svg" alt="Price Lens" className="logo-animation size-5" />
      </span>
      <span className="truncate font-bold tracking-tight">Price Lens</span>
    </Link>
  )
}
