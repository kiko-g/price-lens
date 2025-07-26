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

        primary: `bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground`,
        secondary: `bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 dark:bg-secondary dark:hover:bg-secondary/90 dark:text-secondary-foreground`,

        destructive: `bg-rose-600 text-white shadow-sm hover:bg-rose-600/90 dark:bg-rose-700 dark:hover:bg-rose-700/90 dark:text-white`,
        orange: `bg-orange-600 text-white shadow-sm hover:bg-orange-600/90 dark:bg-orange-700 dark:hover:bg-orange-700/90 dark:text-white`,
        success: `bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 dark:bg-emerald-700 dark:hover:bg-emerald-700/90 dark:text-white`,
        outline: `border-input bg-transparent shadow-sm hover:bg-zinc-200/80 dark:bg-zinc-800/10 dark:hover:bg-zinc-800`,

        ghost: `hover:bg-zinc-200/80 dark:hover:bg-zinc-100/20`,
        "ghost-inverted": "bg-accent hover:bg-accent/80",
        "ghost-light": `hover:bg-zinc-200/80`,
        "ghost-dark": `hover:bg-zinc-100/20`,
        "ghost-destructive": `text-rose-600 hover:bg-rose-600/10`,

        glass: `bg-zinc-100 backdrop-blur text-zinc-900 hover:bg-zinc-500/20 dark:bg-zinc-900/80 dark:text-white dark:hover:bg-zinc-950/80`,

        active: `bg-zinc-200/80 dark:bg-zinc-100/20`,

        link: `text-primary underline-offset-4 hover:underline`,
        "dropdown-item": `bg-transparent font-normal w-full justify-between border-0`,
        "gradient-primary": `bg-linear-to-r from-primary/80 to-secondary/80 text-white transition-all duration-300 dark:from-primary/90 dark:to-secondary/90 hover:opacity-80`,

        marketing: `bg-primary text-primary-foreground ring-primary before:from-primary-foreground/20 after:from-primary-foreground/10 relative isolate inline-flex w-full items-center justify-center overflow-hidden rounded-md px-3 text-left text-sm font-medium ring-1 transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:opacity-80 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-md after:bg-gradient-to-b after:to-transparent after:mix-blend-overlay hover:opacity-90`,

        "marketing-secondary": `bg-secondary text-secondary-foreground ring-secondary-foreground/10 before:from-secondary-foreground/10 after:from-secondary-foreground/5 relative isolate inline-flex w-full items-center justify-center overflow-hidden rounded-md px-3 text-left text-sm font-medium ring-1 transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:opacity-80 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-md after:bg-gradient-to-b after:to-transparent after:mix-blend-overlay hover:opacity-90`,

        "marketing-white": `bg-white text-zinc-900 ring-zinc-900/10 before:from-zinc-900/10 after:from-zinc-900/5 relative isolate inline-flex w-full items-center justify-center overflow-hidden rounded-md px-3 text-left text-sm font-medium ring-1 transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:opacity-80 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-md after:bg-gradient-to-b after:to-transparent after:mix-blend-overlay hover:opacity-90`,
      },
      size: {
        default: `px-3 py-1.5`,
        xs: `px-1.5 py-0.5 text-xs`,
        sm: `px-2.5 py-1 gap-1.5`,
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
