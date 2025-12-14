"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const tooltipVariants = cva(
  "z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-zinc-50",
        secondary: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50",
        destructive: "bg-rose-600 text-zinc-50 dark:bg-rose-800",
        success: "bg-emerald-600 text-zinc-50 dark:bg-emerald-800",
        warning: "bg-yellow-600 text-zinc-50 dark:bg-yellow-800",
        glass: "bg-zinc-950/80 text-zinc-50 backdrop-blur",
      },
      size: {
        default: "px-3 py-1.5 text-xs",
        xs: "px-2 py-1 text-2xs",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2 text-sm",
      },
      roundedness: {
        default: "rounded-sm",
        sm: "rounded-sm",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      roundedness: "default",
    },
  },
)

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, VariantProps<typeof tooltipVariants> {}

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  ({ className, sideOffset = 4, variant, size, roundedness, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(tooltipVariants({ variant, size, roundedness }), className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  ),
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
