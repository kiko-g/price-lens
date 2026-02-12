"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import type { PriorityDistribution } from "@/lib/queries/store-products"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { PriorityBubble } from "@/components/products/PriorityBubble"

import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon, SparklesIcon, ShieldIcon } from "lucide-react"

interface BulkPriorityDialogProps {
  filterParams: string
  filterSummary?: string
  children: React.ReactNode
}

interface BulkPriorityData {
  count: number
  distribution: PriorityDistribution
}

export function BulkPriorityDialog({ filterParams, filterSummary, children }: BulkPriorityDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null)
  const [preservePriorities, setPreservePriorities] = useState<number[]>([])
  const queryClient = useQueryClient()

  // Fetch count and distribution of matching products when dialog opens
  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["bulk-priority-count", filterParams],
    queryFn: async () => {
      const res = await axios.get(`/api/store_products/bulk-priority?${filterParams}`)
      return res.data as BulkPriorityData
    },
    enabled: open,
    staleTime: 0,
  })

  // Calculate actual count to update (excluding preserved priorities)
  const actualUpdateCount = useMemo(() => {
    if (!countData?.distribution) return countData?.count ?? 0

    let count = countData.count
    for (const priority of preservePriorities) {
      count -= countData.distribution[priority] ?? 0
    }
    return Math.max(0, count)
  }, [countData, preservePriorities])

  // Build query params with excludePriorities
  const buildQueryParams = () => {
    let params = filterParams
    if (preservePriorities.length > 0) {
      const excludeParam = `excludePriorities=${preservePriorities.join(",")}`
      params = params ? `${params}&${excludeParam}` : excludeParam
    }
    return params
  }

  // Mutation for updating priority
  const updateMutation = useMutation({
    mutationFn: async (priority: number) => {
      const params = buildQueryParams()
      const res = await axios.patch(`/api/store_products/bulk-priority?${params}`, { priority })
      return res.data as { updatedCount: number }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
      refetchCount()
    },
  })

  // Handle dialog open state change - reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setSelectedPriority(null)
        setPreservePriorities([])
        updateMutation.reset()
      }, 150)
    }
  }

  const handleApply = () => {
    if (selectedPriority === null) return
    updateMutation.mutate(selectedPriority)
  }

  const handlePreserveToggle = (priority: number) => {
    setPreservePriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority],
    )
  }

  const totalCount = countData?.count ?? 0
  const distribution = countData?.distribution ?? {}
  const isSuccess = updateMutation.isSuccess
  const updatedCount = updateMutation.data?.updatedCount ?? 0

  // Get priorities that exist in the distribution (have at least 1 product)
  const existingPriorities = PRODUCT_PRIORITY_LEVELS.filter((p) => (distribution[p] ?? 0) > 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            Bulk Set Priority
          </DialogTitle>
          <DialogDescription>
            Set priority for all products matching the current filters. This will mark them as manually reviewed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filter Summary */}
          {filterSummary && (
            <div className="bg-muted/50 rounded-md p-3">
              <Label className="text-muted-foreground text-xs font-medium uppercase">Active Filters</Label>
              <p className="mt-1 text-sm">{filterSummary}</p>
            </div>
          )}

          {/* Matching Count with Distribution */}
          <div className="rounded-md border p-3">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Products Matching Filters</Label>
            <div className="mt-1">
              {isLoadingCount ? (
                <Skeleton className="h-6 w-20" />
              ) : countError ? (
                <span className="text-destructive text-sm">Error loading count</span>
              ) : (
                <div className="space-y-2">
                  <span className="text-2xl font-bold">{totalCount.toLocaleString()}</span>

                  {/* Priority Distribution */}
                  {Object.keys(distribution).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PRODUCT_PRIORITY_LEVELS.map((priority) => {
                        const count = distribution[priority] ?? 0
                        if (count === 0) return null
                        return (
                          <div
                            key={priority}
                            className="bg-muted/50 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                          >
                            <PriorityBubble priority={priority} size="xs" />
                            <span className="text-muted-foreground">{count.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      {distribution[-1] && distribution[-1] > 0 && (
                        <div className="bg-muted/50 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs">
                          <span className="text-muted-foreground">No priority:</span>
                          <span className="text-muted-foreground">{distribution[-1].toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Priority Selection */}
          {!isSuccess && (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase">Select New Priority</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRODUCT_PRIORITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedPriority(level)}
                    className={`flex items-center justify-start gap-2 rounded-md border p-2 transition-colors ${
                      selectedPriority === level
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <PriorityBubble priority={level} size="sm" useDescription />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preserve Priorities Section */}
          {!isSuccess && existingPriorities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldIcon className="text-muted-foreground h-4 w-4" />
                <Label className="text-xs font-medium uppercase">Preserve Existing Priorities</Label>
              </div>
              <p className="text-muted-foreground text-xs">
                Check priorities you want to keep unchanged. Products with these priorities will not be updated.
              </p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {existingPriorities.map((priority) => {
                  const count = distribution[priority] ?? 0
                  const isPreserved = preservePriorities.includes(priority)
                  const isTargetPriority = selectedPriority === priority

                  return (
                    <label
                      key={priority}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors ${
                        isPreserved
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-border hover:bg-muted/50 hover:border-blue-500/30"
                      } ${isTargetPriority ? "opacity-50" : ""}`}
                    >
                      <Checkbox
                        checked={isPreserved}
                        onCheckedChange={() => handlePreserveToggle(priority)}
                        disabled={isTargetPriority}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <PriorityBubble priority={priority} size="xs" />
                        <span className="text-muted-foreground text-xs">({count.toLocaleString()})</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Warning */}
          {selectedPriority !== null && !isSuccess && actualUpdateCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This will update <strong>{actualUpdateCount.toLocaleString()}</strong> products to priority{" "}
                <strong>{selectedPriority}</strong> and mark them as manually reviewed.
                {preservePriorities.length > 0 && (
                  <span className="mt-1 block text-xs opacity-80">
                    ({totalCount - actualUpdateCount} products will be preserved)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
              <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Successfully updated <strong>{updatedCount.toLocaleString()}</strong> products to priority{" "}
                <strong>{selectedPriority}</strong>.
              </p>
            </div>
          )}

          {/* Error Message */}
          {updateMutation.isError && (
            <div className="border-destructive/30 bg-destructive/10 flex items-start gap-2 rounded-md border p-3">
              <AlertTriangleIcon className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-destructive text-sm">
                {updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update products"}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {isSuccess ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedPriority === null || actualUpdateCount === 0 || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Apply to ${actualUpdateCount.toLocaleString()} products`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
