import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const codeVariants = cva("relative rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold", {
  variants: {
    variant: {
      default: "bg-cyan-100 text-cyan-700 dark:bg-cyan-600/20 dark:text-cyan-200",
      destructive: "bg-destructive/10 text-destructive dark:bg-destructive/10",
      success: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      muted: "bg-muted/50 text-muted-foreground border border-border/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Code({ className, variant, ...props }: React.ComponentProps<"code"> & VariantProps<typeof codeVariants>) {
  return (
    <code data-slot="code" data-variant={variant} className={cn(codeVariants({ variant }), className)} {...props} />
  )
}

export { Code, codeVariants }
