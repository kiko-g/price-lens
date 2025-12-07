"use client"

import { cn } from "@/lib/utils"
import { GridPattern, GridPatternProps } from "@/components/ui/magic/grid-pattern"

export function HeroGridPattern(props: GridPatternProps) {
  return (
    <div className="bg-background absolute top-0 z-[-1] flex size-full items-center justify-center overflow-hidden">
      <GridPattern
        x={-1}
        y={-1}
        width={25}
        height={25}
        variant="grid"
        {...props}
        className={cn("mask-[linear-gradient(to_bottom_right,white,transparent_45%)]", props.className)}
      />
    </div>
  )
}
