"use client"

import { Button } from "@/components/ui/button"

export default function BrandControlCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Something went wrong loading the Brand Control Center.</p>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
