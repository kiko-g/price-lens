"use client"

import { cn } from "@/lib/utils"
import { GridPattern } from "@/components/magicui/grid-pattern"

export function GridHome() {
  return (
    <div className="absolute top-0 flex size-full items-center justify-center overflow-hidden bg-background">
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
