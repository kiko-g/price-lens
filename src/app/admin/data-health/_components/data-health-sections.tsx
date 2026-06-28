"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  GitBranchIcon,
  LayersIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SkullIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { DAILY_SCRAPE_BUDGET, LANE_SHARES } from "@/lib/business/scrape-budget"
import { CRON_FREQUENCY_MINUTES } from "@/lib/qstash/client"
import { PRIORITY_CONFIG } from "@/lib/business/priority"
import type {
  CohortType,
  DataHealthHistoryPoint,
  DataHealthSlo,
  DataHealthSnapshotData,
  SuccessorSuggestion,
} from "@/types/data-health"
import { useDataHealthCohort, useSuccessorSuggestions } from "@/hooks/useDataHealth"
import { useState } from "react"

function StatBox({
  icon: Icon,
  label,
  value,
  detail,
  color,
  isLoading,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  detail?: string
  color?: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color || "text-muted-foreground")} />
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className={cn("mt-2 text-2xl font-bold", color)}>
          {typeof value === "number" ? value.toLocaleString("pt-PT") : value}
        </p>
      )}
      {detail && <p className="text-muted-foreground mt-1 text-xs">{detail}</p>}
    </div>
  )
}

function SloStatusBadge({ status }: { status: DataHealthSlo["status"] }) {
  if (status === "ok") {
    return (
      <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
        <CheckCircle2Icon className="mr-1 h-3 w-3" />
        OK
      </Badge>
    )
  }
  if (status === "warn") {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-600">
        <AlertTriangleIcon className="mr-1 h-3 w-3" />
        Atenção
      </Badge>
    )
  }
  return (
    <Badge variant="destructive">
      <AlertTriangleIcon className="mr-1 h-3 w-3" />
      Crítico
    </Badge>
  )
}

function formatSloValue(slo: DataHealthSlo): string {
  if (slo.unit === "%") return `${slo.value.toLocaleString("pt-PT")}%`
  if (slo.unit === "MB") return `${slo.value.toLocaleString("pt-PT")} MB`
  if (slo.unit === "days" && slo.value >= 999) return "∞"
  return slo.value.toLocaleString("pt-PT")
}

function formatTarget(slo: DataHealthSlo): string {
  if (slo.direction === "higher_better") return `≥ ${slo.target.toLocaleString("pt-PT")}${slo.unit === "%" ? "%" : slo.unit === "MB" ? " MB" : ""}`
  if (slo.key === "zombies_unrechecked_45d") return "≈ 0"
  return `< ${slo.target.toLocaleString("pt-PT")}${slo.unit === "MB" ? " MB" : ""}`
}

// ---------------------------------------------------------------------------
// 1. SLO Scorecard
// ---------------------------------------------------------------------------

export function SloScorecardSection({
  data,
  history,
  isLoading,
}: {
  data?: DataHealthSnapshotData
  history?: DataHealthHistoryPoint[]
  isLoading: boolean
}) {
  const slos = data?.slos ?? []

  const sparkData =
    history?.map((point) => {
      const row: Record<string, string | number> = {
        date: new Date(point.computed_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" }),
      }
      for (const slo of point.slos) {
        row[slo.key] = slo.value
      }
      return row
    }) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5" />
          SLOs — Saúde dos dados
        </CardTitle>
        <CardDescription>Objetivos semanais (ROADMAP §7)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
            : slos.map((slo) => (
                <div key={slo.key} className="bg-muted/50 space-y-2 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{slo.label}</p>
                    <SloStatusBadge status={slo.status} />
                  </div>
                  <p className="text-2xl font-bold">{formatSloValue(slo)}</p>
                  <p className="text-muted-foreground text-xs">Meta: {formatTarget(slo)}</p>
                </div>
              ))}
        </div>

        {sparkData.length > 1 && (
          <div className="pt-2">
            <p className="text-muted-foreground mb-2 text-sm">Tendência P5 frescos &lt; 48h</p>
            <ChartContainer
              className="h-32 w-full"
              config={{ p5_fresh_48h: { label: "P5 %", color: "hsl(var(--chart-1))" } }}
            >
              <LineChart data={sparkData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis domain={[0, 100]} hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="p5_fresh_48h" stroke="var(--color-p5_fresh_48h)" dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 2. Pipeline Inspector
// ---------------------------------------------------------------------------

export function PipelineInspectorSection({
  data,
  isLoading,
}: {
  data?: DataHealthSnapshotData
  isLoading: boolean
}) {
  const pipeline = data?.pipeline
  const lanes = data?.lanes?.h48

  const funnel = [
    { step: "Discovery (7d)", value: pipeline?.discovery_urls_new_7d ?? 0 },
    { step: "Triage (7d)", value: pipeline?.triage_7d ?? 0 },
    { step: "Skeleton backlog", value: pipeline?.skeleton_total ?? 0 },
    { step: "Agendados (48h)", value: pipeline?.lane_scheduled_48h ?? 0 },
    { step: "Scrapes OK (48h)", value: pipeline?.scrape_success_48h ?? 0 },
  ]

  const laneRows = lanes
    ? [
        { lane: "SLA", ...lanes.sla, scrape: lanes.scrape_runs.sla },
        { lane: "Healing", ...lanes.healing, scrape: lanes.scrape_runs.healing },
        { lane: "Long tail", ...lanes.long_tail, scrape: lanes.scrape_runs.long_tail },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranchIcon className="h-5 w-5" />
          Inspetor de pipeline
        </CardTitle>
        <CardDescription>Discovery → triage → lanes → scrape_runs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : funnel.map((item, i) => (
                <div key={item.step} className="relative">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-xs">{item.step}</p>
                    <p className="text-xl font-bold">{item.value.toLocaleString("pt-PT")}</p>
                  </div>
                  {i < funnel.length - 1 && (
                    <ArrowRightIcon className="text-muted-foreground absolute top-1/2 -right-3 hidden h-4 w-4 -translate-y-1/2 sm:block" />
                  )}
                </div>
              ))}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lane (48h)</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Preenchidos</TableHead>
                <TableHead className="text-right">Fill %</TableHead>
                <TableHead className="text-right">Scrape OK %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                laneRows.map((row) => (
                  <TableRow key={row.lane}>
                    <TableCell className="font-medium">{row.lane}</TableCell>
                    <TableCell className="text-right">{row.requested.toLocaleString("pt-PT")}</TableCell>
                    <TableCell className="text-right">{row.filled.toLocaleString("pt-PT")}</TableCell>
                    <TableCell className="text-right">{row.fill_pct}%</TableCell>
                    <TableCell className="text-right">{row.scrape.success_rate}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data?.discovery?.per_origin && !isLoading && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Discovery por loja (30d)</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {data.discovery.per_origin.map((store) => (
                <div key={store.origin_id} className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                  <SupermarketChainBadge originId={store.origin_id} variant="badge" />
                  <div className="text-right text-sm">
                    <p>{store.runs_30d} exec.</p>
                    <p className="text-muted-foreground">{store.urls_new_30d} novos URLs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 3. Backlog Management
// ---------------------------------------------------------------------------

export function BacklogSection({ data, isLoading }: { data?: DataHealthSnapshotData; isLoading: boolean }) {
  const backlog = data?.backlog
  const runsPerDay = (24 * 60) / CRON_FREQUENCY_MINUTES
  const perRunBudget = Math.floor(DAILY_SCRAPE_BUDGET / runsPerDay)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayersIcon className="h-5 w-5" />
          Gestão de backlog
        </CardTitle>
        <CardDescription>Pressão de skeletons, triage e políticas atuais (só leitura)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox
            icon={LayersIcon}
            label="Skeletons"
            value={backlog?.skeleton_total ?? 0}
            detail={`+${backlog?.skeleton_intake_7d ?? 0} intake / 7d`}
            isLoading={isLoading}
          />
          <StatBox
            icon={ActivityIcon}
            label="Triage (24h)"
            value={backlog?.triage_24h ?? 0}
            detail={`${backlog?.triage_7d ?? 0} / 7d`}
            isLoading={isLoading}
          />
          <StatBox icon={DatabaseIcon} label="Estacionados" value={backlog?.parked ?? 0} isLoading={isLoading} />
          <StatBox icon={DatabaseIcon} label="Vetados" value={backlog?.vetoed ?? 0} isLoading={isLoading} />
        </div>

        {!isLoading && backlog && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pressão líquida (intake − triage, 7d)</span>
              <span className={cn("font-medium", backlog.net_skeleton_pressure > 0 && "text-amber-600")}>
                {backlog.net_skeleton_pressure > 0 ? "+" : ""}
                {backlog.net_skeleton_pressure.toLocaleString("pt-PT")}
              </span>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, (backlog.triage_7d / Math.max(backlog.skeleton_intake_7d, 1)) * 100))}
              className="h-2"
            />
          </div>
        )}

        <div className="bg-muted/30 rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">Políticas atuais (constantes)</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Orçamento diário:</span>{" "}
              {DAILY_SCRAPE_BUDGET.toLocaleString("pt-PT")} scrapes
            </p>
            <p>
              <span className="text-muted-foreground">Lanes:</span> SLA {(LANE_SHARES.sla * 100).toFixed(0)}% / Healing{" "}
              {(LANE_SHARES.healing * 100).toFixed(0)}% / Long tail {(LANE_SHARES.longTail * 100).toFixed(0)}%
            </p>
            <p>
              <span className="text-muted-foreground">Por execução (~{runsPerDay}/dia):</span> ~{perRunBudget} slots
            </p>
            <p>
              <span className="text-muted-foreground">Triage cron:</span> 80 produtos / 2h
            </p>
          </div>
        </div>

        {data?.freshness?.by_priority && !isLoading && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Frescura por prioridade</p>
            {data.freshness.by_priority.map((p) => (
              <div key={p.priority} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>
                    P{p.priority} ({PRIORITY_CONFIG[String(p.priority)]?.description ?? ""})
                  </span>
                  <span>
                    {p.fresh.toLocaleString("pt-PT")} / {p.total.toLocaleString("pt-PT")} ({p.fresh_pct}%)
                  </span>
                </div>
                <Progress value={p.fresh_pct} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 4. Revival / Graveyard
// ---------------------------------------------------------------------------

const COHORT_OPTIONS: { type: CohortType; label: string }[] = [
  { type: "zombie", label: "Zombies > 30d" },
  { type: "false_zombie", label: "Falsos zombies (HTTP 200)" },
  { type: "skeleton", label: "Skeletons" },
  { type: "parked", label: "Estacionados" },
]

export function RevivalSection({ data, isLoading }: { data?: DataHealthSnapshotData; isLoading: boolean }) {
  const [cohortType, setCohortType] = useState<CohortType>("zombie")
  const zombies = data?.zombies
  const { data: cohort, isLoading: cohortLoading } = useDataHealthCohort(cohortType)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SkullIcon className="h-5 w-5" />
          Revival / Cemitério
        </CardTitle>
        <CardDescription>Cohorts de zombies, healing e amostra para revisão</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox icon={SkullIcon} label="Indisponíveis" value={zombies?.unavailable_total ?? 0} isLoading={isLoading} />
          <StatBox icon={SkullIcon} label="Stale > 30d" value={zombies?.stale_30d ?? 0} isLoading={isLoading} />
          <StatBox icon={SkullIcon} label="Stale > 45d" value={zombies?.stale_45d ?? 0} isLoading={isLoading} />
          <StatBox
            icon={AlertTriangleIcon}
            label="Falsos zombies"
            value={zombies?.false_zombie ?? 0}
            detail={`${zombies?.no_barcode_pct ?? 0}% sem barcode`}
            color="text-amber-600"
            isLoading={isLoading}
          />
        </div>

        {data?.lanes?.h48 && !isLoading && (
          <div className="bg-muted/30 rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">Healing lane (48h)</p>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <p>
                Preenchidos: {data.lanes.h48.healing.filled.toLocaleString("pt-PT")} /{" "}
                {data.lanes.h48.healing.requested.toLocaleString("pt-PT")}
              </p>
              <p>Fill: {data.lanes.h48.healing.fill_pct}%</p>
              <p>Scrape OK: {data.lanes.h48.scrape_runs.healing.success_rate}%</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {COHORT_OPTIONS.map((opt) => (
              <Button
                key={opt.type}
                variant={cohortType === opt.type ? "default" : "outline"}
                size="sm"
                onClick={() => setCohortType(opt.type)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {cohortLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : cohort ? (
            <>
              <p className="text-muted-foreground text-sm">
                Total: {cohort.total.toLocaleString("pt-PT")} — amostra (máx. 50)
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>Scraped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohort.sample.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          {row.origin_id ? <SupermarketChainBadge originId={row.origin_id} variant="logoSmall" /> : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.name ?? "(skeleton)"}</TableCell>
                        <TableCell>{row.last_http_status ?? "—"}</TableCell>
                        <TableCell>
                          {row.scraped_at
                            ? new Date(row.scraped_at).toLocaleDateString("pt-PT")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 5. Successor Families (v0)
// ---------------------------------------------------------------------------

export function SuccessorSection() {
  const { data, isLoading, isError } = useSuccessorSuggestions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5" />
          Famílias sucessoras (v0)
        </CardTitle>
        <CardDescription>
          Sugestões heurísticas — só leitura. Ver <code className="text-xs">docs/successor-families-v0.md</code> para
          especificação v2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : isError ? (
          <p className="text-destructive text-sm">Não foi possível carregar sugestões.</p>
        ) : !data?.suggestions.length ? (
          <p className="text-muted-foreground text-sm">Sem sugestões encontradas com os critérios atuais.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Antecessor</TableHead>
                  <TableHead>Sucessor</TableHead>
                  <TableHead>Marca / Categoria</TableHead>
                  <TableHead>Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.suggestions.map((s: SuccessorSuggestion) => (
                  <TableRow key={`${s.predecessor_id}-${s.successor_id}`}>
                    <TableCell>
                      <SupermarketChainBadge originId={s.origin_id} variant="logoSmall" />
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <p className="truncate text-sm">{s.predecessor_name ?? `#${s.predecessor_id}`}</p>
                      <p className="text-muted-foreground text-xs">{s.predecessor_barcode ?? "sem GTIN"}</p>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <p className="truncate text-sm">{s.successor_name ?? `#${s.successor_id}`}</p>
                      <p className="text-muted-foreground text-xs">{s.successor_barcode ?? "sem GTIN"}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.brand}
                      <br />
                      <span className="text-muted-foreground">{s.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.confidence === "medium" ? "default" : "secondary"}>{s.confidence}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 6. DB & Volatility sidebar stats
// ---------------------------------------------------------------------------

export function DbVolatilitySection({ data, isLoading }: { data?: DataHealthSnapshotData; isLoading: boolean }) {
  const weekly = data?.db?.weekly_price_rows ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DatabaseIcon className="h-4 w-4" />
            Base de dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatBox
            icon={DatabaseIcon}
            label="Tamanho"
            value={`${data?.db?.size_mb ?? 0} MB`}
            detail="Limite free tier: 500 MB"
            isLoading={isLoading}
          />
          {weekly.length > 0 && !isLoading && (
            <ChartContainer
              className="h-40 w-full"
              config={{ count: { label: "Preços/semana", color: "hsl(var(--chart-2))" } }}
            >
              <BarChart data={weekly}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="week"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("pt-PT", { month: "short", day: "numeric" })}
                  fontSize={10}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ActivityIcon className="h-4 w-4" />
            Volatilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatBox
            icon={ActivityIcon}
            label="Com price stats"
            value={`${data?.volatility?.with_stats_pct ?? 0}%`}
            detail={
              data?.volatility?.last_update
                ? `Última atualização: ${new Date(data.volatility.last_update).toLocaleDateString("pt-PT")}`
                : undefined
            }
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 7. Manual Triggers (failsafe)
// ---------------------------------------------------------------------------

export function ManualTriggersSection({
  onRecompute,
  isRecomputing,
}: {
  onRecompute: () => void
  isRecomputing: boolean
}) {
  const [running, setRunning] = useState<string | null>(null)

  const trigger = async (key: string, url: string) => {
    setRunning(key)
    try {
      await fetch(url, { method: key === "triage" ? "GET" : "POST" })
    } catch (err) {
      console.error(`[ManualTriggers] ${key} failed:`, err)
    } finally {
      setRunning(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCwIcon className="h-4 w-4" />
          Ações manuais (failsafe)
        </CardTitle>
        <CardDescription>Reutiliza endpoints existentes — usar apenas em emergência</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onRecompute} disabled={isRecomputing}>
          {isRecomputing ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}
          Recomputar snapshot
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={running === "discovery"}
          onClick={() => trigger("discovery", "/api/admin/discovery?action=run&origin=all")}
        >
          Discovery (todas)
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={running === "triage"}
          onClick={() => trigger("triage", "/api/admin/discovery/triage?batch=80")}
        >
          Triage (80)
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={running === "analytics"}
          onClick={() => trigger("analytics", "/api/admin/analytics/recompute")}
        >
          Analytics snapshot
        </Button>
      </CardContent>
    </Card>
  )
}
