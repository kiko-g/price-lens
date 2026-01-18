"use client"

import { useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityBubble } from "@/components/PriorityBubble"
import { StoreProductCard, ProductCardSkeleton } from "@/components/StoreProductCard"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  WrenchIcon,
  Loader2Icon,
  CircleIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import type { ScheduleOverview, StalenessStatus, ProductsByStalenessResponse } from "../types"
import { PRIORITY_CONFIG, formatThreshold } from "../constants"

export default function ScheduleDistributionPage() {
  const queryClient = useQueryClient()
  const [fixResult, setFixResult] = useState<{ fixed: number } | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<number | null | undefined>(undefined)
  const [stalenessFilter, setStalenessFilter] = useState<StalenessStatus>("stale")
  const [page, setPage] = useState(1)
  const limit = 24

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["schedule-overview"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=overview")
      return res.data as ScheduleOverview
    },
    staleTime: 60000,
  })

  const fixPhantomMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get("/api/admin/schedule?action=fix-phantom-scraped")
      return res.data as { fixed: number; message: string }
    },
    onSuccess: (data) => {
      setFixResult({ fixed: data.fixed })
      queryClient.invalidateQueries({ queryKey: ["schedule-overview"] })
    },
  })

  // Fetch products when a priority is selected
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ["products-by-staleness", selectedPriority, stalenessFilter, page],
    queryFn: async () => {
      const priorityParam = selectedPriority === null ? "null" : selectedPriority
      const res = await axios.get(
        `/api/admin/schedule?action=products-by-staleness&priority=${priorityParam}&status=${stalenessFilter}&page=${page}&limit=${limit}`,
      )
      return res.data as ProductsByStalenessResponse
    },
    enabled: selectedPriority !== undefined,
    staleTime: 30000,
  })

  const handlePriorityClick = (priority: number | null) => {
    if (selectedPriority === priority) {
      // Clicking the same priority deselects it
      setSelectedPriority(undefined)
    } else {
      setSelectedPriority(priority)
      setPage(1) // Reset page when changing priority
    }
  }

  const handleFilterChange = (filter: StalenessStatus) => {
    setStalenessFilter(filter)
    setPage(1) // Reset page when changing filter
  }

  const selectedStat = overview?.priorityStats.find((s) => s.priority === selectedPriority)
  const priorityConfig = selectedPriority !== null ? PRIORITY_CONFIG[selectedPriority ?? 0] : null

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Phantom Scraped Warning */}
        {overview && overview.totalPhantomScraped > 0 && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                <AlertTriangleIcon className="h-5 w-5" />
                Data Integrity Issue Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                Found <strong className="text-foreground">{overview.totalPhantomScraped.toLocaleString()}</strong>{" "}
                products that appear scraped (have{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">updated_at</code> set) but have{" "}
                <strong>no price records</strong>. These products won&apos;t be picked up by the scheduler.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fixPhantomMutation.mutate()}
                  disabled={fixPhantomMutation.isPending}
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                >
                  {fixPhantomMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <WrenchIcon className="mr-2 h-4 w-4" />
                      Fix {overview.totalPhantomScraped.toLocaleString()} products
                    </>
                  )}
                </Button>
                {fixResult && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    ✓ Fixed {fixResult.fixed} products - they will be scraped on the next run
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
            <CardDescription>Product count and staleness by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overview?.priorityStats
                  .filter((s) => s.priority !== null)
                  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                  .map((stat) => {
                    const config = PRIORITY_CONFIG[stat.priority ?? 0]
                    const isActive = overview.activePriorities.includes(stat.priority ?? 0)
                    const stalePercent = stat.total > 0 ? Math.round((stat.stale / stat.total) * 100) : 0
                    const freshPercent = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0
                    const isSelected = selectedPriority === stat.priority

                    return (
                      <div
                        key={stat.priority}
                        onClick={() => handlePriorityClick(stat.priority)}
                        className={cn(
                          "cursor-pointer rounded-lg border p-4 transition-all",
                          !isActive && "bg-accent border-dashed opacity-80",
                          isSelected && "ring-primary ring-2 ring-offset-2",
                          !isSelected && "hover:border-primary/50 hover:shadow-sm",
                        )}
                      >
                        <div className="mb-2 flex flex-col flex-wrap gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <PriorityBubble priority={stat.priority} size="sm" />
                              <span className="font-medium">{config?.name}</span>
                            </div>
                            {!isActive && (
                              <Badge variant="default" className="text-xs" size="xs">
                                Not scheduled
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stat.total.toLocaleString()} products</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Refresh: {formatThreshold(stat.stalenessThresholdHours)}
                            </span>
                          </div>
                        </div>

                        <div className="flex h-6 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                          {stat.stale > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="flex items-center justify-center bg-red-500 text-xs font-medium text-white transition-all"
                                    style={{ width: `${stalePercent}%` }}
                                  >
                                    {stalePercent > 10 && `${stat.stale.toLocaleString()}`}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {stat.stale.toLocaleString()} stale ({stalePercent}%)
                                  </p>
                                  {stat.neverScraped > 0 && (
                                    <p className="text-muted-foreground text-xs">
                                      Including {stat.neverScraped.toLocaleString()} never scraped
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {stat.fresh > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                                    style={{ width: `${freshPercent}%` }}
                                  >
                                    {freshPercent > 10 && `${stat.fresh.toLocaleString()}`}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="mt-3 flex flex-col gap-1 text-xs font-medium">
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangleIcon className="h-4 w-4" />
                            {stat.stale.toLocaleString()} stale ({stalePercent}%)
                          </span>
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle2Icon className="h-4 w-4" />
                            {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                          </span>
                          {stat.neverScraped > 0 && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CircleIcon className="h-4 w-4" />
                              {stat.neverScraped.toLocaleString()} never scraped
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                {overview?.priorityStats.find((s) => s.priority === null) && (
                  <div
                    onClick={() => handlePriorityClick(null)}
                    className={cn(
                      "bg-accent col-span-1 flex cursor-pointer justify-between gap-2 rounded-lg border border-dashed p-4 opacity-80 transition-all sm:col-span-2 lg:col-span-3",
                      selectedPriority === null && "ring-primary ring-2 ring-offset-2",
                      selectedPriority !== null && "hover:border-primary/50 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <PriorityBubble priority={null} size="sm" />
                      <span className="font-medium">Unclassified</span>
                      <span className="text-muted-foreground text-sm">
                        ({overview.priorityStats.find((s) => s.priority === null)?.total.toLocaleString()} products)
                      </span>
                    </div>

                    <div>
                      <Badge variant="default" className="text-xs" size="xs">
                        Not scheduled
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Detail Section */}
        {selectedPriority !== undefined && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PriorityBubble priority={selectedPriority} size="md" />
                  <div>
                    <CardTitle className="text-lg">
                      {selectedPriority === null ? "Unclassified" : priorityConfig?.name} Products
                    </CardTitle>
                    <CardDescription>
                      {productsData?.pagination.totalCount.toLocaleString() ?? "..."} products matching filter
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedPriority(undefined)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <Tabs
                value={stalenessFilter}
                onValueChange={(v) => handleFilterChange(v as StalenessStatus)}
                className="mb-6"
              >
                <TabsList>
                  <TabsTrigger value="stale" className="gap-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    All Stale
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.stale.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="never-scraped" className="gap-2">
                    <CircleIcon className="h-4 w-4" />
                    Never Scraped
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.neverScraped.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="fresh" className="gap-2">
                    <CheckCircle2Icon className="h-4 w-4" />
                    Fresh
                    {selectedStat && (
                      <Badge variant="secondary" size="xs">
                        {selectedStat.fresh.toLocaleString()}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Products Grid */}
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: limit }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : productsData?.data && productsData.data.length > 0 ? (
                <>
                  <div
                    className={cn(
                      "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
                      isFetchingProducts && "opacity-50",
                    )}
                  >
                    {productsData.data.map((product) => (
                      <StoreProductCard key={product.id} sp={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {productsData.pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Page {productsData.pagination.page} of {productsData.pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={!productsData.pagination.hasPreviousPage || isFetchingProducts}
                        >
                          <ChevronLeftIcon className="mr-1 h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!productsData.pagination.hasNextPage || isFetchingProducts}
                        >
                          Next
                          <ChevronRightIcon className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <CircleIcon className="mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm">
                    There are no {stalenessFilter === "never-scraped" ? "never scraped" : stalenessFilter} products for
                    this priority level.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
