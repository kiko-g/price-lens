import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2 md:items-start md:gap-12">
        <div className="flex flex-col items-center gap-4 md:max-w-md md:items-start">
          <Skeleton className="h-9 w-56 md:w-72" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <div className="flex w-full max-w-md flex-col gap-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full max-w-md rounded-lg" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="hidden md:flex md:flex-col md:gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="min-h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
