import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const calloutVariants = cva(
  "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-info/20 bg-info/10 [&_svg]:text-info",
        warning: "border-warning/20 bg-warning/10 [&_svg]:text-warning",
        destructive: "border-destructive/20 bg-destructive/10 [&_svg]:text-destructive",
        success: "border-success/20 bg-success/10 [&_svg]:text-success",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  icon?: LucideIcon
}

function Callout({ className, variant, icon: Icon, children, ...props }: CalloutProps) {
  return (
    <div className={cn(calloutVariants({ variant }), className)} {...props}>
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export { Callout, calloutVariants }
