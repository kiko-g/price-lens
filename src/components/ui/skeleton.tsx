import { cn } from "@/lib/utils"

type Props = {
  variant?: "default" | "outline" | "shimmer"
} & React.HTMLAttributes<HTMLDivElement>

function Skeleton({ variant = "default", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "default" && "animate-pulse bg-muted",
        variant === "outline" && "animate-pulse border-border border",
        variant === "shimmer" && "relative overflow-hidden bg-muted",
        className,
      )}
      {...props}
    >
      {variant === "shimmer" && (
        <span
          className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          aria-hidden
        />
      )}
    </div>
  )
}

export { Skeleton }
