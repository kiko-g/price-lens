"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DataHealthLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </CardContent>
        </Card>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
