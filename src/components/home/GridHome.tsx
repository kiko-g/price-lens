"use client"

import { cn } from "@/lib/utils"
import { GridPattern } from "@/components/magicui/grid-pattern"

export function GridHome() {
  return (
    <div className="absolute flex size-full items-center justify-center overflow-hidden rounded-lg bg-background p-20">
      <GridPattern
        width={40}
        height={40}
        x={-1}
        y={-1}
        className={cn("[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]")}
      />
    </div>
  )
}
