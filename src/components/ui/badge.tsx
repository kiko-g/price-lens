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
        secondary:
          "border-transparent bg-zinc-200 text-zinc-900 hover:bg-zinc-200/80 dark:border-transparent dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80 [&_span.bubble]:bg-zinc-100 dark:[&_span.bubble]:bg-zinc-800",
        destructive:
          "border-transparent bg-red-600 text-zinc-50 hover:bg-red-600/80 dark:border-transparent dark:bg-red-700 dark:text-zinc-50 dark:hover:bg-red-700/80 [&_span.bubble]:bg-red-600",
        success:
          "border-transparent bg-emerald-600 text-zinc-50 hover:bg-emerald-600/80 dark:border-transparent dark:bg-emerald-800 dark:text-zinc-50 dark:hover:bg-emerald-800/80 [&_span.bubble]:bg-emerald-600",
        warning:
          "border-transparent bg-yellow-600 text-zinc-50 hover:bg-yellow-600/80 dark:border-transparent dark:bg-yellow-800 dark:text-zinc-50 dark:hover:bg-yellow-800/80 [&_span.bubble]:bg-yellow-600",
        retail:
          "border-transparent bg-orange-600 text-zinc-50 hover:bg-orange-600/80 dark:border-transparent dark:bg-orange-800 dark:text-zinc-50 dark:hover:bg-orange-800/80 [&_span.bubble]:bg-orange-600",
        light: "border-transparent dark:border-transparent bg-white text-zinc-900 hover:bg-white/80",
        dark: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80",
        outline:
          "border-zinc-300 text-zinc-950 dark:border-zinc-300 dark:text-zinc-200 [&_span.bubble]:bg-zinc-300 dark:[&_span.bubble]:bg-zinc-800",
        "outline-success":
          "border-emerald-600 bg-emerald-600/5 text-emerald-600 dark:border-emerald-800 dark:text-emerald-50 dark:bg-emerald-600/10 [&_span.bubble]:bg-emerald-500 dark:[&_span.bubble]:bg-emerald-600",
        "outline-destructive":
          "border-red-600 bg-red-600/5 text-red-600 dark:border-red-800 dark:text-red-50 dark:bg-red-600/10 [&_span.bubble]:bg-red-500 dark:[&_span.bubble]:bg-red-600",
        "outline-warning":
          "border-yellow-600 bg-yellow-600/5 text-yellow-600 dark:border-yellow-800 dark:text-yellow-50 dark:bg-yellow-600/10 [&_span.bubble]:bg-yellow-500 dark:[&_span.bubble]:bg-yellow-800",
        "price-per-unit":
          "border-transparent bg-yellow-400 text-zinc-800 hover:bg-yellow-400/80 dark:border-transparent dark:bg-yellow-500 dark:text-zinc-700 dark:hover:bg-yellow-500/80 [&_span.bubble]:bg-yellow-400 dark:[&_span.bubble]:bg-yellow-500",
      },
      size: {
        default: `px-3 py-1 [&_span.bubble]:size-2 [&_svg]:size-3`,
        xs: `px-1.5 py-0.5 text-xs [&_span.bubble]:size-1.5 [&_svg]:size-2.5`,
        sm: `px-2.5 py-1 [&_span.bubble]:size-2 [&_svg]:size-3`,
        md: `px-3 py-1.5 [&_span.bubble]:size-2 [&_svg]:size-3.5`,
        lg: `px-3.5 py-2 [&_span.bubble]:size-2.5 [&_svg]:size-4`,
        xl: `px-6 py-4 [&_span.bubble]:size-3 [&_svg]:size-4`,
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
