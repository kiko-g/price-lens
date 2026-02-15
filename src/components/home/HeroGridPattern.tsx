"use client"

import { cn } from "@/lib/utils"
import { GridPattern, GridPatternProps } from "@/components/ui/magic/grid-pattern"

interface HeroGridPatternProps extends GridPatternProps {
  withGradient?: boolean
}

function Blobs() {
  return (
    <>
      {/* Primary — centered on mobile, top-right on desktop */}
      <div className="bg-primary-400/30 dark:bg-primary-500/30 pointer-events-none absolute -top-20 left-0 h-[350px] w-[120vw] -translate-x-1/2 rounded-full blur-[100px] md:-top-60 md:right-0 md:left-auto md:h-[500px] md:w-[800px] md:translate-x-0 md:blur-[128px]" />
      {/* Secondary — centered on mobile, inset on desktop */}
      <div className="bg-secondary-400/30 dark:bg-secondary-400/30 pointer-events-none absolute -top-8 left-2/3 h-[250px] w-[80vw] -translate-x-1/2 rounded-full blur-[100px] md:-top-32 md:right-[20%] md:left-2/5 md:h-[400px] md:w-[600px] md:translate-x-0 md:blur-[128px]" />
    </>
  )
}

export function HeroGridPattern({ withGradient, ...props }: HeroGridPatternProps) {
  if (withGradient) {
    return (
      <div className="absolute inset-x-0 -top-24 z-[-1] h-[calc(100svh+12rem)] overflow-hidden">
        <div className="bg-background absolute top-0 -left-20 h-full w-[calc(100%+10rem)]">
          <Blobs />

          <GridPattern
            x={10}
            y={10}
            width={50}
            height={50}
            rotate={5}
            variant="diagonal"
            {...props}
            className={cn(
              "mask-[linear-gradient(to_bottom,white_0%,white_80%,transparent_100%)]",
              "stroke-gray-400/25 dark:stroke-gray-400/10",
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
