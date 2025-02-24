import { cn, PageStatus } from "@/lib/utils"

export function Wrapper({ children, status = PageStatus.Loaded }: { children: React.ReactNode; status?: PageStatus }) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-4",
        status === PageStatus.Loading && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
        status === PageStatus.Loaded && "bg-zinc-100 dark:bg-zinc-900",
        status === PageStatus.Error && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
      )}
    >
      {children}
    </div>
  )
}
