"use client"

import { Button } from "@/components/ui/button"

export default function DataHealthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">Algo correu mal ao carregar a saúde dos dados.</p>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
