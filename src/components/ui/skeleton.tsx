import { cn } from "@/lib/utils"

type Props = {
  variant?: "default" | "outline" | "shimmer"
} & React.HTMLAttributes<HTMLDivElement>

function Skeleton({ variant = "default", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "default" && "bg-muted animate-pulse",
        variant === "outline" && "border-border animate-pulse border",
        variant === "shimmer" && "bg-muted relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {variant === "shimmer" && (
        <span
          className="animate-skeleton-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
          aria-hidden
        />
      )}
    </div>
  )
}

export { Skeleton }
