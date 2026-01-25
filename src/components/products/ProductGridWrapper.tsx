"use client"

import { cn } from "@/lib/utils"

type ProductGridWrapperProps = {
  children: React.ReactNode
  className?: string
  variant?: "grid" | "list"
}

export function ProductGridWrapper({ children, className, variant = "grid" }: ProductGridWrapperProps) {
  return (
    <div
      className={cn(
        variant === "list"
          ? "flex flex-col gap-2"
          : [
              "grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
              "3xl:grid-cols-7 4xl:grid-cols-8 5xl:grid-cols-9",
            ],
        className,
      )}
    >
      {children}
    </div>
  )
}
