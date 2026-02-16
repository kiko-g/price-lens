import { cn } from "@/lib/utils"

type Props = {
  variant?: "default" | "outline"
} & React.HTMLAttributes<HTMLDivElement>

function Skeleton({ variant = "default", className, ...props }: Props) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        variant === "default" && "bg-muted",
        variant === "outline" && "border-border border",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
