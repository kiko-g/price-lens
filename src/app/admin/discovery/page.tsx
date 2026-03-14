"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import {
  MapIcon,
  RefreshCwIcon,
  PlayIcon,
  DatabaseIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  SearchIcon,
  ExternalLinkIcon,
  Loader2Icon,
  FilterIcon,
  ShieldBanIcon,
  PackageOpenIcon,
  AlertTriangleIcon,
  ParkingCircleIcon,
  ScaleIcon,
} from "lucide-react"

interface StoreStatus {
  originId: number
  name: string
  sitemapIndexUrl: string
  totalProducts: number
  fromSitemap: number
  lastDiscoveryRun: string | null
  error: string | null
}

interface TriageStats {
  untriagedCount: number
  totalVetoed: number
  vetoedByOrigin: Record<number, number>
  parkedCount: number
  parkedByOrigin: Record<number, number>
}

interface DiscoveryStatus {
  stores: StoreStatus[]
  availableOrigins: { id: number; name: string }[]
  triage: TriageStats
}

interface TriageResult {
  processed: number
  kept: number
  vetoed: number
  parked: number
  errors: number
  notFound: number
  unmappedCategories: { originId: number; category: string; category2: string | null; category3: string | null }[]
  durationMs: number
}

interface DiscoveryResult {
  originId: number
  originName: string
  source: string
  urlsFound: number
  urlsNew: number
  urlsExisting: number
  urlsInvalid: number
  errors: string[]
  durationMs: number
  sampleNewUrls: string[]
}

export default function DiscoveryPage() {
  const queryClient = useQueryClient()
  const [dryRun, setDryRun] = useState(true)
  const [runningOrigin, setRunningOrigin] = useState<number | "all" | null>(null)
  const [lastResults, setLastResults] = useState<DiscoveryResult[] | null>(null)
  const [lastTriageResult, setLastTriageResult] = useState<TriageResult | null>(null)
  const [lastTriageMode, setLastTriageMode] = useState<"triage" | "audit">("triage")
  const [auditScope, setAuditScope] = useState<"parked" | "full">("parked")
  const [auditForce, setAuditForce] = useState(false)
  const [auditOrigin, setAuditOrigin] = useState<number | "all">("all")

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["discovery-status"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/discovery?action=status")
      return res.data as DiscoveryStatus
    },
    staleTime: 30000,
  })

  const runDiscoveryMutation = useMutation({
    mutationFn: async (origin: number | "all") => {
      if (origin === "all") {
        const originIds = status?.availableOrigins.map((o) => o.id) ?? [1, 2, 3]
        const allResults: DiscoveryResult[] = []
        for (const oid of originIds) {
          setRunningOrigin(oid)
          const res = await axios.get(`/api/admin/discovery?action=run&origin=${oid}&dry=${dryRun}&verbose=true`)
          allResults.push(res.data.result)
        }
        return { results: allResults }
      }
      const res = await axios.get(`/api/admin/discovery?action=run&origin=${origin}&dry=${dryRun}&verbose=true`)
      return res.data
    },
    onSuccess: (data) => {
      const results = data.results || [data.result]
      setLastResults(results)

      const totalNew = results.reduce((sum: number, r: DiscoveryResult) => sum + r.urlsNew, 0)

      if (dryRun) {
        toast.info(`Dry run complete. Would discover ${totalNew.toLocaleString()} new products.`)
      } else {
        toast.success(`Discovery complete! Found ${totalNew.toLocaleString()} new products.`)
        queryClient.invalidateQueries({ queryKey: ["discovery-status"] })
      }
    },
    onError: (error) => {
      toast.error(`Discovery failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    },
    onSettled: () => {
      setRunningOrigin(null)
    },
  })

  const runTriageMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get(`/api/admin/discovery/triage?batch=80&dry=${dryRun}&verbose=true`)
      return res.data as { message: string; mode: string; dryRun: boolean; result: TriageResult }
    },
    onSuccess: (data) => {
      setLastTriageResult(data.result)
      setLastTriageMode("triage")

      if (dryRun) {
        toast.info(data.message)
      } else {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ["discovery-status"] })
      }
    },
    onError: (error) => {
      toast.error(`Triage failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    },
  })

  const runAuditMutation = useMutation({
    mutationFn: async ({ scope, force, origin }: { scope: "parked" | "full"; force: boolean; origin: number | "all" }) => {
      if (origin === "all" && scope === "full") {
        const originIds = status?.availableOrigins.map((o) => o.id) ?? [1, 2, 3]
        const merged: TriageResult = { processed: 0, kept: 0, vetoed: 0, parked: 0, errors: 0, notFound: 0, unmappedCategories: [], durationMs: 0 }
        for (const oid of originIds) {
          const res = await axios.get(
            `/api/admin/discovery/triage?mode=audit&scope=${scope}&force=${force}&dry=${dryRun}&verbose=true&origin=${oid}`,
          )
          const r = res.data.result as TriageResult
          merged.processed += r.processed
          merged.kept += r.kept
          merged.vetoed += r.vetoed
          merged.parked += r.parked
          merged.errors += r.errors
          merged.notFound += r.notFound
          merged.unmappedCategories.push(...r.unmappedCategories)
          merged.durationMs += r.durationMs
        }
        return { message: `Audit complete across all origins`, mode: "audit", scope, dryRun, result: merged }
      }
      const originParam = origin === "all" ? "" : `&origin=${origin}`
      const res = await axios.get(
        `/api/admin/discovery/triage?mode=audit&scope=${scope}&force=${force}&dry=${dryRun}&verbose=true${originParam}`,
      )
      return res.data as { message: string; mode: string; scope: string; dryRun: boolean; result: TriageResult }
    },
    onSuccess: (data) => {
      setLastTriageResult(data.result)
      setLastTriageMode("audit")

      if (dryRun) {
        toast.info(data.message)
      } else {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ["discovery-status"] })
      }
    },
    onError: (error) => {
      toast.error(`Audit failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    },
  })

  const handleRunDiscovery = (origin: number | "all") => {
    setRunningOrigin(origin)
    setLastResults(null)
    runDiscoveryMutation.mutate(origin)
  }

  const isTriageRunning = runTriageMutation.isPending || runAuditMutation.isPending

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapIcon className="text-primary size-5" />
                  Product Discovery
                </CardTitle>
                <CardDescription className="mt-1">
                  Discover new products from store sitemaps to ensure complete catalog coverage
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCwIcon className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
                <Label htmlFor="dry-run" className="text-sm">
                  Dry Run {dryRun && <span className="text-muted-foreground">(preview only, no database changes)</span>}
                </Label>
              </div>

              <div className="flex-1" />

              <Button onClick={() => handleRunDiscovery("all")} disabled={runningOrigin !== null}>
                {runningOrigin === "all" ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    Run All Stores
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Store Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </>
          ) : (
            status?.stores.map((store) => (
              <Card key={store.originId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SupermarketChainBadge originId={store.originId} variant="logoSmall" />
                      <CardTitle className="text-base">{store.name}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunDiscovery(store.originId)}
                      disabled={runningOrigin !== null}
                    >
                      {runningOrigin === store.originId ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <SearchIcon className="h-3.5 w-3.5" />
                          Discover
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-md p-2.5">
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <DatabaseIcon className="h-3 w-3" />
                        Products in DB
                      </div>
                      <p className="mt-0.5 text-lg font-bold">{store.totalProducts.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2.5">
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <ClockIcon className="h-3 w-3" />
                        Last Discovery
                      </div>
                      <p className="mt-0.5 text-sm font-medium">
                        {store.lastDiscoveryRun ? format(new Date(store.lastDiscoveryRun), "MMM d, HH:mm") : "Never"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={store.sitemapIndexUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      {store.sitemapIndexUrl}
                    </a>
                  </div>

                  {store.error && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircleIcon className="h-3.5 w-3.5" />
                      {store.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Section */}
        {lastResults && lastResults.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2Icon className="text-primary h-5 w-5" />
                Discovery Results
                {dryRun && (
                  <Badge variant="outline" className="ml-2">
                    Dry Run
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {lastResults.map((result) => (
                  <AccordionItem key={result.originId} value={String(result.originId)}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4">
                        <div className="flex items-center gap-2">
                          <SupermarketChainBadge originId={result.originId} variant="logoSmall" />
                          <span className="font-medium">{result.originName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-emerald-500">+{result.urlsNew.toLocaleString()} new</span>
                          <span className="text-muted-foreground">{result.urlsFound.toLocaleString()} found</span>
                          <span className="text-muted-foreground">{(result.durationMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Found in Source</p>
                            <p className="text-lg font-bold">{result.urlsFound.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">New Products</p>
                            <p className="text-lg font-bold text-emerald-500">{result.urlsNew.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Already Known</p>
                            <p className="text-lg font-bold">{result.urlsExisting.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Invalid URLs</p>
                            <p className={cn("text-lg font-bold", result.urlsInvalid > 0 && "text-amber-500")}>
                              {result.urlsInvalid.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {result.urlsFound > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Coverage</span>
                              <span>
                                {((result.urlsExisting / result.urlsFound) * 100).toFixed(1)}% already tracked
                              </span>
                            </div>
                            <Progress value={(result.urlsExisting / result.urlsFound) * 100} className="h-2" />
                          </div>
                        )}

                        {result.sampleNewUrls.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs font-medium">
                              Sample new products ({Math.min(result.sampleNewUrls.length, 10)} of {result.urlsNew}):
                            </p>
                            <div className="bg-muted/50 max-h-40 overflow-y-auto rounded-md p-2">
                              {result.sampleNewUrls.slice(0, 10).map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary block truncate text-xs hover:underline"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.errors.length > 0 && (
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                              <AlertCircleIcon className="h-3.5 w-3.5" />
                              Errors ({result.errors.length}):
                            </p>
                            <div className="max-h-24 overflow-y-auto rounded-md bg-red-500/10 p-2 text-xs text-red-500">
                              {result.errors.map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Triage Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FilterIcon className="text-primary size-5" />
                  Product Triage
                </CardTitle>
                <CardDescription className="mt-1">
                  Classify newly discovered products: scrape, categorize, then keep, park, or veto based on governance
                  rules
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLastTriageResult(null)
                    runAuditMutation.mutate({ scope: auditScope, force: auditForce, origin: auditScope === "full" ? auditOrigin : "all" })
                  }}
                  disabled={isTriageRunning}
                >
                  {runAuditMutation.isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <ScaleIcon className="h-4 w-4" />
                      Run Audit
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setLastTriageResult(null)
                    runTriageMutation.mutate()
                  }}
                  disabled={isTriageRunning}
                >
                  {runTriageMutation.isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Triaging...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      Run Triage
                    </>
                  )}
                </Button>

                <div className="border-secondary flex items-center rounded-lg border">
                  <Button
                    variant={auditScope === "parked" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setAuditScope("parked")}
                    className="h-7 rounded-r-none text-xs"
                  >
                    Parked
                  </Button>
                  <Button
                    size="sm"
                    variant={auditScope === "full" ? "secondary" : "ghost"}
                    onClick={() => setAuditScope("full")}
                    className="h-7 rounded-l-none text-xs"
                  >
                    Full
                  </Button>
                </div>

                {auditScope === "full" && (
                  <>
                  <Select value={String(auditOrigin)} onValueChange={(v) => setAuditOrigin(v === "all" ? "all" : parseInt(v, 10))}>
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stores</SelectItem>
                      {status?.availableOrigins.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="audit-force"
                      checked={auditForce}
                      onCheckedChange={setAuditForce}
                      className="scale-75"
                    />
                    <Label htmlFor="audit-force" className="text-xs">
                      Override all
                    </Label>
                  </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Triage Stats */}
            {isLoading ? (
              <div className="grid grid-cols-4 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : status?.triage ? (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-md p-3">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <PackageOpenIcon className="h-3.5 w-3.5" />
                    Awaiting Triage
                  </div>
                  <p className={cn("mt-1 text-2xl font-bold", status.triage.untriagedCount > 0 && "text-amber-500")}>
                    {status.triage.untriagedCount.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs">unscraped products</p>
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <ParkingCircleIcon className="h-3.5 w-3.5" />
                    Parked
                  </div>
                  <p className={cn("mt-1 text-2xl font-bold", status.triage.parkedCount > 0 && "text-blue-500")}>
                    {status.triage.parkedCount.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs">unmapped categories</p>
                  {status.triage.parkedCount > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {status.availableOrigins.map((origin) => {
                        const count = status.triage.parkedByOrigin[origin.id] ?? 0
                        if (count === 0) return null
                        return (
                          <div key={origin.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{origin.name}</span>
                            <span className="font-medium">{count.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <ShieldBanIcon className="h-3.5 w-3.5" />
                    Total Vetoed
                  </div>
                  <p className="mt-1 text-2xl font-bold">{status.triage.totalVetoed.toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">SKUs permanently excluded</p>
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <DatabaseIcon className="h-3.5 w-3.5" />
                    Vetoed by Store
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {status.availableOrigins.map((origin) => (
                      <div key={origin.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{origin.name}</span>
                        <span className="font-medium">
                          {(status.triage.vetoedByOrigin[origin.id] ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Last Triage/Audit Result */}
            {lastTriageResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">{lastTriageMode === "audit" ? "Audit" : "Triage"} Results</span>
                  {dryRun && (
                    <Badge variant="outline" className="text-xs">
                      Dry Run
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {lastTriageMode === "audit" ? "Audit" : "Triage"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {(lastTriageResult.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Processed</p>
                    <p className="text-lg font-bold">{lastTriageResult.processed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">{lastTriageMode === "audit" ? "Promoted" : "Kept"}</p>
                    <p className="text-lg font-bold text-emerald-500">{lastTriageResult.kept}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Parked</p>
                    <p className={cn("text-lg font-bold", lastTriageResult.parked > 0 && "text-blue-500")}>
                      {lastTriageResult.parked}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Vetoed</p>
                    <p className={cn("text-lg font-bold", lastTriageResult.vetoed > 0 && "text-amber-500")}>
                      {lastTriageResult.vetoed}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Errors</p>
                    <p className={cn("text-lg font-bold", lastTriageResult.errors > 0 && "text-red-500")}>
                      {lastTriageResult.errors}
                    </p>
                  </div>
                </div>

                {lastTriageResult.unmappedCategories.length > 0 && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-xs font-medium text-amber-500">
                      <AlertTriangleIcon className="h-3.5 w-3.5" />
                      Unmapped Categories ({lastTriageResult.unmappedCategories.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto rounded-md bg-amber-500/10 p-2">
                      {lastTriageResult.unmappedCategories.map((cat, i) => (
                        <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
                          [{status?.availableOrigins.find((o) => o.id === cat.originId)?.name ?? cat.originId}]{" "}
                          {[cat.category, cat.category2, cat.category3].filter(Boolean).join(" > ")}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>1. Discovery:</strong> Fetches product URLs from store sitemaps (Continente, Auchan) or category
              crawls (Pingo Doce). New products are inserted with null priority.
            </p>
            <p>
              <strong>2. Triage:</strong> Scrapes untriaged products to get name and categories. Based on category
              governance:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Mapped + Tracked</strong>: kept with the category&apos;s default priority
              </li>
              <li>
                <strong>Mapped + Untracked</strong>: vetoed (deleted + SKU recorded permanently)
              </li>
              <li>
                <strong>Unmapped</strong>: parked (priority=0, stays in DB). Add the mapping, then audit.
              </li>
            </ul>
            <p>
              <strong>3. Audit:</strong> Re-evaluates parked products against current category mappings. No scraping
              needed (uses existing data). Promotes, vetoes, or leaves parked.
            </p>
            <p className="pt-2 font-medium text-amber-500">
              Workflow: Map categories first, then run Triage. If unmapped categories appear, add mappings and run
              Audit.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
