"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Loader2Icon, RefreshCwIcon, DatabaseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AnalyticsSnapshot } from "@/types/analytics"

import {
  ScrapeStatusSection,
  StoreBreakdownSection,
  ScrapeFreshnessSection,
  PriceIntelligenceSection,
  DataQualitySection,
  PriorityHealthSection,
  GrowthSection,
  SchedulerCapacitySection,
  ScrapeRunsSection,
} from "./_components/analytics-sections"

export default function AnalyticsPage() {
  const [isRecomputing, setIsRecomputing] = useState(false)
  const recomputeBaselineRef = useRef<string | null>(null)

  const {
    data: snapshot,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/analytics")
      return res.data as AnalyticsSnapshot
    },
    staleTime: 60_000,
    retry: 1,
    refetchInterval: isRecomputing ? 5_000 : false,
  })

  useEffect(() => {
    if (!isRecomputing || !snapshot) return
    if (snapshot.computed_at !== recomputeBaselineRef.current) {
      setIsRecomputing(false)
      recomputeBaselineRef.current = null
      toast.success("Analytics snapshot recomputed", {
        description: `Took ${snapshot.duration_ms.toLocaleString()}ms`,
      })
    }
  }, [snapshot, isRecomputing])

  const handleRecompute = async () => {
    try {
      recomputeBaselineRef.current = snapshot?.computed_at ?? ""
      setIsRecomputing(true)
      const res = await axios.post("/api/admin/analytics/recompute")
      if (res.data.status === "completed") {
        await refetch()
      }
    } catch {
      setIsRecomputing(false)
      recomputeBaselineRef.current = null
      toast.error("Failed to queue recompute")
    }
  }

  const data = snapshot?.data
  const computedAgo = snapshot ? formatDistanceToNow(new Date(snapshot.computed_at), { addSuffix: true }) : null
  const hasData = !!data

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm">System health, KPIs, and data quality</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {computedAgo && (
              <Badge variant="secondary" className="text-xs font-normal">
                Computed {computedAgo}
              </Badge>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {hasData && (
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || isRecomputing}>
                  <RefreshCwIcon className={cn("h-4 w-4", isFetching && "animate-spin")} />
                  Refresh
                </Button>
              )}
              <Button size="sm" onClick={handleRecompute} disabled={isRecomputing}>
                {isRecomputing ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                {isRecomputing ? "Recomputing…" : "Recompute"}
              </Button>
            </div>
          </div>
        </div>

        {/* Empty / error state */}
        {!isLoading && !hasData && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <DatabaseIcon className="text-muted-foreground h-12 w-12" />
              <div className="text-center">
                <p className="text-lg font-medium">{isError ? "Failed to load analytics" : "No analytics data yet"}</p>
                <p className="text-muted-foreground text-sm">
                  {isError
                    ? "Check that the migration has been applied and try again."
                    : "Click Recompute to generate the first snapshot."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {(isLoading || hasData) && (
          <>
            <ScrapeStatusSection data={data} isLoading={isLoading} />

            <div className="grid gap-6 lg:grid-cols-2">
              <StoreBreakdownSection data={data} isLoading={isLoading} />
              <ScrapeFreshnessSection data={data} isLoading={isLoading} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PriceIntelligenceSection data={data} isLoading={isLoading} />
              <DataQualitySection data={data} isLoading={isLoading} />
            </div>

            <PriorityHealthSection data={data} isLoading={isLoading} />

            <GrowthSection data={data} isLoading={isLoading} />

            <SchedulerCapacitySection data={data} isLoading={isLoading} />

            <ScrapeRunsSection data={data} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  )
}
