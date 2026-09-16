"use client"

import { cn } from "@/lib/utils"
import { GridPattern, GridPatternProps } from "@/components/ui/magic/grid-pattern"

interface HeroGridPatternProps extends GridPatternProps {
  withGradient?: boolean
}

/**
 * Lince brand backdrop: a skewed geometric grid that fades out from one corner, plus an ember glow
 * bleeding from the top-right and a navy glow anchoring the bottom-left. Stays faint on purpose —
 * it must never compete with prices.
 */
function Glows() {
  return (
    <>
      <div className="bg-primary/25 dark:bg-primary/20 pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[70vw] rounded-full blur-[140px] md:-top-48 md:h-[560px] md:w-[760px] md:blur-[180px]" />
      <div className="bg-secondary/25 dark:bg-secondary-800/60 pointer-events-none absolute -bottom-24 left-[-10%] h-[320px] w-[60vw] rounded-full blur-[140px] md:h-[420px] md:w-[620px]" />
    </>
  )
}

export function HeroGridPattern({ withGradient, ...props }: HeroGridPatternProps) {
  if (withGradient) {
    return (
      <div className="absolute inset-x-0 -top-24 bottom-0 z-[-1] h-[calc(100svh)] overflow-hidden">
        <div className="bg-background absolute top-0 -left-20 h-full w-[calc(100%+10rem)]">
          <Glows />
          <div className="absolute inset-0 origin-top-left scale-[1.35] -skew-y-12 mask-[radial-gradient(ellipse_65%_75%_at_60%_10%,black_15%,transparent_72%)]">
            <GridPattern
              x={0}
              y={0}
              width={56}
              height={56}
              variant="grid"
              {...props}
              className={cn("stroke-foreground/12 fill-none dark:stroke-white/9", props.className)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background absolute top-0 z-[-1] flex size-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 origin-top-left scale-[1.2] -skew-y-6 mask-[linear-gradient(to_bottom_right,black,transparent_50%)]">
        <GridPattern
          x={0}
          y={0}
          width={props.width ?? 40}
          height={props.height ?? 40}
          variant="grid"
          {...props}
          className={cn("stroke-foreground/8 fill-none dark:stroke-white/6", props.className)}
        />
      </div>
    </div>
  )
}
