"use client"

import Link from "next/link"
import { LogoIcon } from "@/components/icons/LogoIcon"

export function LogoLink() {
  return (
    <Link href="/" className="flex items-center justify-center gap-1.5 transition hover:opacity-80">
      <LogoIcon className="logo-animation h-6 w-6" />
      <span className="hidden font-bold tracking-tight lg:inline-block">Bagger UI</span>
    </Link>
  )
}
