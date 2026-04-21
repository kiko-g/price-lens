import { cn } from "@/lib/utils"

type Props = {
  variant?: "default" | "outline" | "shimmer"
} & React.HTMLAttributes<HTMLDivElement>

function Skeleton({ variant = "default", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "default" && "bg-muted animate-pulse dark:bg-white/10",
        variant === "outline" && "border-border animate-pulse border",
        variant === "shimmer" && "bg-muted relative overflow-hidden dark:bg-white/10",
        className,
      )}
      {...props}
    >
      {variant === "shimmer" && (
        <span
          className={cn(
            "animate-skeleton-shimmer absolute inset-0 -translate-x-full",
            "bg-linear-to-r from-transparent via-white/38 to-transparent",
            "dark:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_40%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.05)_60%,transparent_100%)]",
          )}
          aria-hidden
        />
      )}
    </div>
  )
}

export { Skeleton }
