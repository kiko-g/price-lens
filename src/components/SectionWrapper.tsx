import { cn } from "@/lib/utils"

type StatusVariant = "loading" | "loaded" | "error"

export function Wrapper({ children, variant = "loaded" }: { children: React.ReactNode; variant?: StatusVariant }) {
  return (
    <div className="m-4 flex flex-1 flex-col items-center justify-center">
      <div
        className={cn(
          "flex h-full w-full max-w-full flex-1 flex-col items-center justify-center gap-4 overflow-x-auto rounded-lg border p-4 sm:p-6",
          variant === "loading" && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
          variant === "loaded" && "bg-zinc-100 dark:bg-zinc-900",
          variant === "error" && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
        )}
      >
        {children}
      </div>
    </div>
  )
}
