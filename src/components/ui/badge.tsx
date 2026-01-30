import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex gap-1.5 items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:border-zinc-800 dark:focus:ring-zinc-300 [&_span.bubble]:pointer-events-none [&_span.bubble]:size-2 [&_span.bubble]:rounded-full [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:border-transparent dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80 [&_span.bubble]:bg-zinc-100 dark:[&_span.bubble]:bg-zinc-800",
        boring:
          "border-transparent bg-zinc-200 text-zinc-900 hover:bg-zinc-200/80 dark:border-transparent dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80 [&_span.bubble]:bg-zinc-100 dark:[&_span.bubble]:bg-zinc-800",
        primary:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 dark:border-transparent dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 [&_span.bubble]:bg-primary dark:[&_span.bubble]:bg-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 [&_span.bubble]:bg-secondary dark:[&_span.bubble]:bg-secondary",
        tertiary:
          "border-transparent bg-gray-900 text-white hover:opacity-80 dark:border-transparent dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700/80 [&_span.bubble]:bg-gray-700 dark:[&_span.bubble]:bg-gray-800",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/80 dark:border-transparent dark:bg-destructive dark:text-white dark:hover:bg-destructive/80 [&_span.bubble]:bg-destructive",
        gray: "border-transparent bg-gray-500 text-white hover:bg-gray-500/80 dark:border-transparent dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700/80 [&_span.bubble]:bg-gray-500 dark:[&_span.bubble]:bg-gray-800",
        success:
          "border-transparent bg-emerald-600 text-zinc-50 hover:bg-emerald-600/80 dark:border-transparent dark:bg-emerald-800 dark:text-zinc-50 dark:hover:bg-emerald-800/80 [&_span.bubble]:bg-emerald-600",
        warning:
          "border-transparent bg-yellow-600 text-zinc-50 hover:bg-yellow-600/80 dark:border-transparent dark:bg-yellow-800 dark:text-zinc-50 dark:hover:bg-yellow-800/80 [&_span.bubble]:bg-yellow-600",
        retail:
          "border-transparent bg-orange-600 text-zinc-50 hover:bg-orange-600/80 dark:border-transparent dark:bg-orange-700 dark:text-zinc-50 dark:hover:bg-orange-700/80 [&_span.bubble]:bg-orange-600",
        light: "border-transparent dark:border-transparent bg-white text-zinc-900 hover:bg-white/80",
        dark: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80",
        outline:
          "border-zinc-300 text-zinc-950 dark:border-zinc-300 dark:text-zinc-200 [&_span.bubble]:bg-zinc-300 dark:[&_span.bubble]:bg-zinc-800",
        "outline-white": "border-base-400 border bg-white text-zinc-900 [&_span.bubble]:bg-white dark:border-base-300",
        "outline-success":
          "border-emerald-600 bg-emerald-600/5 text-emerald-600 dark:border-emerald-800 dark:text-emerald-50 dark:bg-emerald-600/10 [&_span.bubble]:bg-emerald-500 dark:[&_span.bubble]:bg-emerald-600",
        "outline-destructive":
          "border-red-500/50 bg-red-500/10 text-red-600 dark:border-red-500/40 dark:text-red-50 dark:bg-red-600/20 [&_span.bubble]:bg-red-500 dark:[&_span.bubble]:bg-red-600",
        "outline-warning":
          "border-yellow-600 bg-yellow-600/5 text-yellow-600 dark:border-yellow-800 dark:text-yellow-50 dark:bg-yellow-600/10 [&_span.bubble]:bg-yellow-500 dark:[&_span.bubble]:bg-yellow-800",
        "price-per-unit":
          "border-transparent bg-amber-500 text-white hover:bg-amber-500/80 dark:border-transparent dark:bg-amber-600 dark:text-white dark:hover:bg-amber-600/80 [&_span.bubble]:bg-amber-600 dark:[&_span.bubble]:bg-amber-600",
        unit: "border-transparent bg-zinc-200 text-zinc-900 hover:bg-zinc-200/80 dark:border-transparent dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80 [&_span.bubble]:bg-zinc-100 dark:[&_span.bubble]:bg-zinc-800",
        blue: "border-transparent bg-blue-600 text-zinc-50 hover:bg-blue-600/80 dark:border-transparent dark:bg-blue-800 dark:text-zinc-50 dark:hover:bg-blue-800/80 [&_span.bubble]:bg-blue-600 dark:[&_span.bubble]:bg-blue-800",
        sky: "border-transparent bg-sky-600 text-zinc-50 hover:bg-sky-600/80 dark:border-transparent dark:bg-sky-800 dark:text-zinc-50 dark:hover:bg-sky-800/80 [&_span.bubble]:bg-sky-600 dark:[&_span.bubble]:bg-sky-800",
        white:
          "border-transparent bg-white text-zinc-900 hover:bg-white/80 dark:border-transparent dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-900/80 [&_span.bubble]:bg-white dark:[&_span.bubble]:bg-zinc-900",
        "glass-success":
          "border-transparent bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 dark:border-transparent dark:bg-emerald-500/20 dark:text-emerald-50 dark:hover:bg-emerald-500/30 [&_span.bubble]:bg-emerald-600 dark:[&_span.bubble]:bg-emerald-800",
      },
      size: {
        default: `px-3 py-1 [&_span.bubble]:size-2 [&_svg]:size-3`,
        "3xs": `px-0.5 py-px text-3xs [&_span.bubble]:size-1.5 [&_svg]:size-2.5`,
        "2xs": `px-1 py-px text-2xs [&_span.bubble]:size-1.5 [&_svg]:size-2.5`,
        xs: `px-1.5 py-0.5 text-xs [&_span.bubble]:size-1.5 [&_svg]:size-2.5`,
        sm: `px-2.5 py-1 [&_span.bubble]:size-2 [&_svg]:size-3`,
        md: `px-3 py-1.5 [&_span.bubble]:size-2 [&_svg]:size-3.5`,
        lg: `px-3.5 py-2 [&_span.bubble]:size-2.5 [&_svg]:size-4`,
        xl: `px-6 py-4 [&_span.bubble]:size-3 [&_svg]:size-4`,
        icon: `p-2`,
        "icon-xl": `p-4 [&_svg]:size-5`,
        "icon-lg": `p-3 [&_svg]:size-5`,
        "icon-sm": `p-1.5`,
        "icon-xs": `p-0.5 [&_svg]:size-3.5`,
      },
      roundedness: {
        default: `rounded-xl`,
        none: `rounded-none`,
        xs: `rounded-xs`,
        sm: `rounded-sm`,
        md: `rounded-md`,
        lg: `rounded-lg`,
        xl: `rounded-xl`,
        "2xl": `rounded-2xl`,
      },
    },
    defaultVariants: {
      variant: "default",
      roundedness: "default",
      size: "default",
    },
  },
)

export type BadgeKind = VariantProps<typeof badgeVariants>["variant"]

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  bubble?: boolean
}

function Badge({ className, variant, roundedness, size, children, bubble, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, roundedness, size }), className)} {...props}>
      {bubble && <span className="bubble" />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
