"use client"

import type { ComponentProps, ReactNode } from "react"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TooltipContentProps = Pick<
  ComponentProps<typeof TooltipContent>,
  "side" | "align" | "sideOffset" | "alignOffset" | "className"
>

export interface ResponsiveTooltipProps extends TooltipContentProps {
  trigger: ReactNode
  title?: string
  children: ReactNode
  /** Applied to `DrawerContent` (e.g. min-height for informational sheets). */
  drawerContentClassName?: string
  drawerTitleClassName?: string
  drawerBodyClassName?: string
  tooltipDelayDuration?: number
}

export function ResponsiveTooltip({
  trigger,
  title,
  children,
  side = "right",
  align = "start",
  sideOffset = 6,
  alignOffset = -6,
  className: tooltipContentClassName,
  drawerContentClassName,
  drawerTitleClassName,
  drawerBodyClassName,
  tooltipDelayDuration = 200,
}: ResponsiveTooltipProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <TooltipProvider delayDuration={tooltipDelayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            className={tooltipContentClassName}
          >
            {title ? <p className="font-semibold">{title}</p> : null}
            {children}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("flex max-h-[85svh] flex-col", drawerContentClassName)}>
        {title ? (
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle className={cn("text-left", drawerTitleClassName)}>{title}</DrawerTitle>
          </DrawerHeader>
        ) : null}
        <div
          className={cn(
            "no-scrollbar text-foreground flex min-h-0 max-w-lg touch-pan-y flex-col overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6",
            drawerBodyClassName,
          )}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
