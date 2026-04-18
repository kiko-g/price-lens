/* eslint-disable @formatjs/no-literal-string-in-jsx -- brand name is intentionally not localized */
"use client"

import Link from "next/link"

export function LogoLink() {
  return (
    <Link href="/" className="flex items-center justify-start gap-1.5 transition hover:opacity-80 md:justify-center">
      <span className="flex items-center justify-center rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/price-lens.svg" alt="Price Lens" className="logo-animation size-5" />
      </span>
      <span className="inline-block font-bold tracking-tight">Price Lens</span>
    </Link>
  )
}
