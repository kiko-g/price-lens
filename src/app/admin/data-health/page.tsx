"use client"

import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { pt } from "date-fns/locale"
import { toast } from "sonner"
import axios from "axios"
import { Loader2Icon, RefreshCwIcon, DatabaseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDataHealth, useDataHealthHistory } from "@/hooks/useDataHealth"

import {
  SloScorecardSection,
  PipelineInspectorSection,
  BacklogSection,
  RevivalSection,
  SuccessorSection,
  DbVolatilitySection,
  ManualTriggersSection,
} from "./_components/data-health-sections"

export default function DataHealthPage() {
  const [isRecomputing, setIsRecomputing] = useState(false)
  const recomputeBaselineRef = useRef<string | null>(null)

  const { data: snapshot, isLoading, isFetching, isError, refetch } = useDataHealth()
  const { data: history } = useDataHealthHistory(30)

  useEffect(() => {
    if (!isRecomputing || !snapshot) return
    if (snapshot.computed_at !== recomputeBaselineRef.current) {
      setIsRecomputing(false)
      recomputeBaselineRef.current = null
      toast.success("Snapshot de saúde dos dados atualizado", {
        description: `Demorou ${snapshot.duration_ms.toLocaleString("pt-PT")}ms`,
      })
    }
  }, [snapshot, isRecomputing])

  const handleRecompute = async () => {
    try {
      recomputeBaselineRef.current = snapshot?.computed_at ?? ""
      setIsRecomputing(true)
      const res = await axios.post("/api/admin/data-health/recompute")
      if (res.data.status === "completed") {
        await refetch()
      }
    } catch (err) {
      console.error("[DataHealthPage] recompute failed:", err)
      setIsRecomputing(false)
      recomputeBaselineRef.current = null
      toast.error("Falha ao recomputar snapshot")
    }
  }

  const data = snapshot?.data
  const computedAgo = snapshot
    ? formatDistanceToNow(new Date(snapshot.computed_at), { addSuffix: true, locale: pt })
    : null
  const hasData = !!data

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Saúde dos Dados</h1>
            <p className="text-muted-foreground text-sm">SLOs, pipeline, backlog e revival</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {computedAgo && (
              <Badge variant="secondary" className="text-xs font-normal">
                Computado {computedAgo}
              </Badge>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {hasData && (
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || isRecomputing}>
                  <RefreshCwIcon className={cn("h-4 w-4", isFetching && "animate-spin")} />
                  Atualizar
                </Button>
              )}
              <Button size="sm" onClick={handleRecompute} disabled={isRecomputing}>
                {isRecomputing ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                {isRecomputing ? "A recomputar…" : "Recomputar"}
              </Button>
            </div>
          </div>
        </div>

        {!isLoading && !hasData && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <DatabaseIcon className="text-muted-foreground h-12 w-12" />
              <div className="text-center">
                <p className="text-lg font-medium">
                  {isError ? "Falha ao carregar dados de saúde" : "Ainda sem snapshot de saúde dos dados"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isError
                    ? "Verifique se a migration foi aplicada e tente novamente."
                    : "Clique em Recomputar para gerar o primeiro snapshot."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {(isLoading || hasData) && (
          <>
            <SloScorecardSection data={data} history={history} isLoading={isLoading} />
            <PipelineInspectorSection data={data} isLoading={isLoading} />
            <BacklogSection data={data} isLoading={isLoading} />
            <RevivalSection data={data} isLoading={isLoading} />
            <SuccessorSection />
            <DbVolatilitySection data={data} isLoading={isLoading} />
            <ManualTriggersSection onRecompute={handleRecompute} isRecomputing={isRecomputing} />
          </>
        )}
      </div>
    </div>
  )
}
