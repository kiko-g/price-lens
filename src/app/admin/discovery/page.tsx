"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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

interface DiscoveryStatus {
  stores: StoreStatus[]
  availableOrigins: { id: number; name: string }[]
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

  const handleRunDiscovery = (origin: number | "all") => {
    setRunningOrigin(origin)
    setLastResults(null)
    runDiscoveryMutation.mutate(origin)
  }

  const storeColors: Record<string, string> = {
    Continente: "bg-red-500",
    Auchan: "bg-green-500",
    "Pingo Doce": "bg-yellow-500",
  }

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

              <Button
                onClick={() => handleRunDiscovery("all")}
                disabled={runningOrigin !== null}
                className="bg-primary"
              >
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
                      <div className={cn("h-3 w-3 rounded-full", storeColors[store.name] || "bg-gray-500")} />
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
                          <div
                            className={cn("h-2.5 w-2.5 rounded-full", storeColors[result.originName] || "bg-gray-500")}
                          />
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
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Found in Sitemap</p>
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

                        {/* Coverage Progress */}
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

                        {/* Sample New URLs */}
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

                        {/* Errors */}
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

        {/* Instructions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">How Discovery Works</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>1. Sitemap Fetch:</strong> Downloads the store&apos;s sitemap index and identifies
              product-specific sitemaps.
            </p>
            <p>
              <strong>2. URL Extraction:</strong> Parses all product URLs from the sitemaps.
            </p>
            <p>
              <strong>3. Validation:</strong> Filters URLs to ensure they match the expected product URL pattern.
            </p>
            <p>
              <strong>4. Deduplication:</strong> Compares against existing products in the database.
            </p>
            <p>
              <strong>5. Insert:</strong> New products are added with priority 0 (unclassified) for later AI
              classification.
            </p>
            <p className="pt-2 font-medium text-amber-500">
              💡 Tip: Run in dry-run mode first to preview what would be discovered without making changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
