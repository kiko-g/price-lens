"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanIcon,
  LayersIcon,
} from "lucide-react"

import type { ScheduleOverview, StalenessStatus, ProductsByStalenessResponse } from "@/app/admin/schedule/types"
import { PRIORITY_CONFIG, formatThreshold } from "@/lib/business/priority"

export function PriorityBrowserSection() {
  const [selectedPriority, setSelectedPriority] = useState<number | null | undefined>(undefined)
  const [stalenessFilter, setStalenessFilter] = useState<StalenessStatus>("stale-actionable")
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
      setSelectedPriority(undefined)
    } else {
      setSelectedPriority(priority)
      setPage(1)
    }
  }

  const handleFilterChange = (filter: StalenessStatus) => {
    setStalenessFilter(filter)
    setPage(1)
  }

  const selectedStat = overview?.priorityStats.find((s) => s.priority === selectedPriority)
  const priorityConfig = selectedPriority !== null ? PRIORITY_CONFIG[selectedPriority ?? 0] : null

  if (isLoadingOverview) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayersIcon className="text-foreground size-5" />
            Priority Distribution
          </CardTitle>
          <CardDescription>Click a priority to browse products by staleness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview?.priorityStats
              .filter((s) => s.priority !== null)
              .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
              .map((stat) => {
                const config = PRIORITY_CONFIG[stat.priority ?? 0]
                const isActive = overview.activePriorities.includes(stat.priority ?? 0)
                const isSelected = selectedPriority === stat.priority

                const freshPercent = stat.total > 0 ? Math.round((stat.fresh / stat.total) * 100) : 0
                const staleActionablePercent =
                  stat.total > 0 ? Math.round((stat.staleActionable / stat.total) * 100) : 0
                const unavailablePercent = stat.total > 0 ? Math.round((stat.unavailable / stat.total) * 100) : 0

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
                          <span className="font-medium">{config?.description}</span>
                        </div>
                        {!isActive && (
                          <Badge variant="default" className="text-xs" size="xs">
                            Not scheduled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-sm font-medium">{stat.total.toLocaleString()} products</span>
                        <span className="text-muted-foreground">
                          Refresh: {formatThreshold(stat.stalenessThresholdHours)}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-6 w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                      {stat.fresh > 0 && (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-center bg-emerald-500 text-xs font-medium text-white transition-all"
                                style={{ width: `${freshPercent}%` }}
                              >
                                {freshPercent > 10 && stat.fresh.toLocaleString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {stat.staleActionable > 0 && (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-center bg-orange-500 text-xs font-medium text-white transition-all"
                                style={{ width: `${staleActionablePercent}%` }}
                              >
                                {staleActionablePercent > 10 && stat.staleActionable.toLocaleString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {stat.staleActionable.toLocaleString()} stale actionable ({staleActionablePercent}%)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {stat.unavailable > 0 && (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-center bg-gray-400 text-xs font-medium text-white transition-all dark:bg-gray-600"
                                style={{ width: `${unavailablePercent}%` }}
                              >
                                {unavailablePercent > 10 && stat.unavailable.toLocaleString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {stat.unavailable.toLocaleString()} unavailable ({unavailablePercent}%)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-1 text-xs font-medium">
                      <span className="text-success flex items-center gap-1">
                        <CheckCircle2Icon className="h-4 w-4" />
                        {stat.fresh.toLocaleString()} fresh ({freshPercent}%)
                      </span>
                      {stat.staleActionable > 0 && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <AlertTriangleIcon className="h-4 w-4" />
                          {stat.staleActionable.toLocaleString()} stale actionable ({staleActionablePercent}%)
                        </span>
                      )}
                      {stat.unavailable > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <BanIcon className="h-4 w-4" />
                          {stat.unavailable.toLocaleString()} unavailable ({unavailablePercent}%)
                        </span>
                      )}
                      {stat.neverScraped > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1 text-[11px] opacity-70">
                          <CircleIcon className="h-3 w-3" />
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
                <Badge variant="default" className="text-xs" size="xs">
                  Not scheduled
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPriority !== undefined && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PriorityBubble priority={selectedPriority} size="md" />
                <div>
                  <CardTitle className="text-lg">
                    {selectedPriority === null ? "Unclassified" : priorityConfig?.description} Products
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
            <Tabs
              value={stalenessFilter}
              onValueChange={(v) => handleFilterChange(v as StalenessStatus)}
              className="mb-6"
            >
              <TabsList className="flex-wrap">
                <TabsTrigger value="stale-actionable" className="gap-2">
                  <AlertTriangleIcon className="h-4 w-4" />
                  Stale Actionable
                  {selectedStat && (
                    <Badge variant="secondary" size="xs">
                      {selectedStat.staleActionable.toLocaleString()}
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
                <TabsTrigger value="unavailable" className="gap-2">
                  <BanIcon className="h-4 w-4" />
                  Unavailable
                  {selectedStat && (
                    <Badge variant="secondary" size="xs">
                      {selectedStat.unavailable.toLocaleString()}
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
              </TabsList>
            </Tabs>

            {isLoadingProducts ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: limit }).map((_, i) => (
                  <StoreProductCardSkeleton key={i} />
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
                        <ChevronLeftIcon className="h-4 w-4" />
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
                  There are no{" "}
                  {stalenessFilter === "stale-actionable"
                    ? "stale actionable"
                    : stalenessFilter === "never-scraped"
                      ? "never scraped"
                      : stalenessFilter}{" "}
                  products for this priority level.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
