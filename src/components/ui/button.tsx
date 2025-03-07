import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap
rounded-md text-sm font-medium border border-transparent transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default: `bg-zinc-800 text-white shadow hover:bg-zinc-800/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200`,
        inverted: `bg-white text-zinc-900 shadow hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700`,
        secondary: `bg-blue-600 text-white shadow-sm hover:bg-blue-600/90 dark:bg-blue-700 dark:hover:bg-blue-700/90 dark:text-white`,
        destructive: `bg-rose-600 text-white shadow-sm hover:bg-rose-600/90 dark:bg-rose-700 dark:hover:bg-rose-700/90 dark:text-white`,
        orange: `bg-orange-600 text-white shadow-sm hover:bg-orange-600/90 dark:bg-orange-700 dark:hover:bg-orange-700/90 dark:text-white`,
        success: `bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 dark:bg-emerald-700 dark:hover:bg-emerald-700/90 dark:text-white`,
        outline: `border-input bg-transparent shadow-sm hover:bg-zinc-100 dark:bg-zinc-800/10 dark:hover:bg-zinc-800`,
        "outline-warning": `border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 shadow-sm dark:bg-orange-500/20 dark:hover:bg-orange-500/30`,
        "outline-destructive": `border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 shadow-sm dark:bg-rose-500/20 dark:hover:bg-rose-500/30`,
        "outline-secondary": `border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 shadow-sm dark:bg-blue-500/20 dark:hover:bg-blue-500/30`,
        ghost: `hover:bg-zinc-200/80 dark:hover:bg-zinc-100/20`,
        "ghost-inverted": `hover:bg-zinc-100/20 dark:hover:bg-zinc-200/80`,
        "ghost-light": `hover:bg-zinc-200/80`,
        "ghost-dark": `hover:bg-zinc-100/20`,
        glass: `bg-zinc-100 backdrop-blur text-zinc-900 hover:bg-zinc-500/20 dark:bg-zinc-900/80 dark:text-white dark:hover:bg-zinc-950/80`,
        active: `bg-zinc-200/80 dark:bg-zinc-100/20`,
        link: `text-primary underline-offset-4 hover:underline`,
        "dropdown-item": `bg-transparent font-normal w-full justify-between border-0`,
      },
      size: {
        default: `px-3 py-1.5`,
        xs: `px-1.5 py-0.5 text-xs`,
        sm: `px-2 py-1 gap-1.5`,
        md: `px-3 py-1.5`,
        lg: `px-3.5 py-2 text-base`,
        xl: `px-4 py-3 text-xl`,
        icon: `p-2`,
        "icon-sm": `p-1.5`,
        "icon-xs": `p-0.5 [&_svg]:size-3.5`,
      },
      roundedness: {
        default: `rounded-md`,
        sm: `rounded-sm`,
        md: `rounded-md`,
        lg: `rounded-lg`,
        xl: `rounded-xl`,
        "2xl": `rounded-2xl`,
        none: `rounded-none`,
      },
    },
    defaultVariants: {
      variant: `default`,
      size: `default`,
      roundedness: `default`,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, roundedness, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, roundedness, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
