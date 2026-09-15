import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function MarkPreviewSurface({
  theme,
  className,
  children,
}: {
  theme: "navy" | "paper"
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-mark-preview-theme={theme}
      className={cn(
        "bg-background text-foreground",
        theme === "navy"
          ? "[--background:#0b0f1a] [--foreground:#e8ebf2] [--primary:var(--primary-500)]"
          : "[--background:#f6f3ee] [--foreground:#14181f] [--primary:var(--primary-600)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
