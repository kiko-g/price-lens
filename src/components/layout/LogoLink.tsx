"use client"

import Link from "next/link"
import { LogoIcon } from "@/components/icons/LogoIcon"

export function LogoLink() {
  return (
    <Link href="/" className="flex items-center justify-center gap-1.5 transition hover:opacity-80">
      <span className="flex items-center justify-center rounded-full bg-zinc-900 p-1">
        <img src="/vercel.svg" alt="Price Lens" className="logo-animation size-3" />
      </span>
      <span className="hidden font-bold tracking-tight lg:inline-block">Price Lens</span>
    </Link>
  )
}
