import { cn } from "@/lib/utils"
import { CircleOffIcon, Loader2Icon } from "lucide-react"

type StatusVariant = "loading" | "loaded" | "error"

export function SkeletonStatusLoading({ children }: { children?: React.ReactNode }) {
  return (
    <StatusWrapper variant="loading">
      <Loader2Icon className="h-6 w-6 animate-spin" />
      {children}
    </StatusWrapper>
  )
}

export function SkeletonStatusError({ children }: { children?: React.ReactNode }) {
  return (
    <StatusWrapper variant="error">
      <CircleOffIcon className="h-6 w-6" />
      {children}
    </StatusWrapper>
  )
}

export function SkeletonStatusLoaded({ children }: { children?: React.ReactNode }) {
  return <StatusWrapper variant="loaded">{children}</StatusWrapper>
}

function StatusWrapper({ children, variant = "loaded" }: { children: React.ReactNode; variant?: StatusVariant }) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-4",
        variant === "loading" && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
        variant === "loaded" && "bg-zinc-100 dark:bg-zinc-900",
        variant === "error" && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
      )}
    >
      {children}
    </div>
  )
}
