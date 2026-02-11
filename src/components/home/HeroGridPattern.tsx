"use client"

import { cn } from "@/lib/utils"
import { GridPattern, GridPatternProps } from "@/components/ui/magic/grid-pattern"

interface HeroGridPatternProps extends GridPatternProps {
  withGradient?: boolean
}

export function HeroGridPattern({ withGradient, ...props }: HeroGridPatternProps) {
  if (withGradient) {
    return (
      <div className="absolute inset-x-0 top-0 z-[-1] h-[120vh] overflow-hidden">
        <div className="bg-background absolute top-0 -left-20 h-full w-[calc(100%+10rem)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1200px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary-500),transparent)] opacity-30 dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary-400),transparent)] dark:opacity-40" />

          <GridPattern
            x={10}
            y={10}
            width={30}
            height={30}
            rotate={5}
            variant="diagonal"
            {...props}
            className={cn(
              "mask-[linear-gradient(to_bottom_right,white,transparent_50%)]",
              "stroke-gray-400/20 dark:stroke-gray-400/20",
              props.className,
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background absolute top-0 z-[-1] flex size-full items-center justify-center overflow-hidden">
      <GridPattern
        x={-1}
        y={-1}
        width={props.width ?? 25}
        height={props.height ?? 25}
        variant="grid"
        {...props}
        className={cn("mask-[linear-gradient(to_bottom_right,white,transparent_45%)]", props.className)}
      />
    </div>
  )
}
