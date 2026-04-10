import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex w-full max-w-lg flex-col items-center justify-center gap-4 px-8 lg:px-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
