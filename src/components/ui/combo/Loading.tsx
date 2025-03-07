import { cn } from "@/lib/utils"
import { FrontendStatus } from "@/types/extra"
import { CircleOffIcon, Loader2Icon } from "lucide-react"

export function SkeletonStatusLoading({ children }: { children?: React.ReactNode }) {
  return (
    <Wrapper status={FrontendStatus.Loading}>
      <Loader2Icon className="h-6 w-6 animate-spin" />
      {children}
    </Wrapper>
  )
}

export function SkeletonStatusError({ children }: { children?: React.ReactNode }) {
  return (
    <Wrapper status={FrontendStatus.Error}>
      <CircleOffIcon className="h-6 w-6" />
      {children}
    </Wrapper>
  )
}

export function SkeletonStatusLoaded({ children }: { children?: React.ReactNode }) {
  return <Wrapper status={FrontendStatus.Loaded}>{children}</Wrapper>
}

function Wrapper({ children, status = FrontendStatus.Loaded }: { children: React.ReactNode; status?: FrontendStatus }) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-lg border p-4",
        status === FrontendStatus.Loading && "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
        status === FrontendStatus.Loaded && "bg-zinc-100 dark:bg-zinc-900",
        status === FrontendStatus.Error && "border-red-500/20 bg-red-500/5 dark:border-red-500/30 dark:bg-red-500/10",
      )}
    >
      {children}
    </div>
  )
}
