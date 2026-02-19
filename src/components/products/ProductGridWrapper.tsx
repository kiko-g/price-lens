"use client"

import { cn } from "@/lib/utils"

type ProductGridWrapperProps = {
  children: React.ReactNode
  className?: string
  dense?: boolean
}

export function ProductGridWrapper({ children, className }: ProductGridWrapperProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        "3xl:grid-cols-7 4xl:grid-cols-8 5xl:grid-cols-9",
        className,
      )}
    >
      {children}
    </div>
  )
}
