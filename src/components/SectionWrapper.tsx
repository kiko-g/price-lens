import { FrontendStatus } from "@/types/extra"
import { cn } from "@/lib/utils"

export function Wrapper({
  children,
  status = FrontendStatus.Loaded,
}: {
  children: React.ReactNode
  status?: FrontendStatus
}) {
  return (
    <div className="m-4">
      <div
        className={cn(
          "flex w-full max-w-full flex-1 flex-col items-center justify-center gap-4 overflow-x-auto rounded-lg border p-4 sm:p-6",
          status === FrontendStatus.Loading && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
          status === FrontendStatus.Loaded && "bg-zinc-100 dark:bg-zinc-900",
          status === FrontendStatus.Error && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
        )}
      >
        {children}
      </div>
    </div>
  )
}
