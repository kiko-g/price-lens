"use client"

import Link from "next/link"

export function LogoLink() {
  return (
    <Link href="/" className="flex items-center justify-center gap-1.5 transition hover:opacity-80">
      <span className="flex items-center justify-center rounded-full">
        <img src="/price-lens.svg" alt="Price Lens" className="logo-animation size-5" />
      </span>
      <span className="inline-block font-bold tracking-tight">Price Lens</span>
    </Link>
  )
}
