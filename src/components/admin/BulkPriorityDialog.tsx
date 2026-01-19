"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { PRODUCT_PRIORITY_LEVELS } from "@/types/business"

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
import { PriorityBubble } from "@/components/PriorityBubble"

import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon, SparklesIcon } from "lucide-react"

interface BulkPriorityDialogProps {
  filterParams: string
  filterSummary?: string
  children: React.ReactNode
}

export function BulkPriorityDialog({ filterParams, filterSummary, children }: BulkPriorityDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null)
  const queryClient = useQueryClient()

  // Fetch count of matching products when dialog opens
  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["bulk-priority-count", filterParams],
    queryFn: async () => {
      const res = await axios.get(`/api/store_products/bulk-priority?${filterParams}`)
      return res.data as { count: number }
    },
    enabled: open,
    staleTime: 0, // Always refetch when dialog opens
  })

  // Mutation for updating priority
  const updateMutation = useMutation({
    mutationFn: async (priority: number) => {
      const res = await axios.patch(`/api/store_products/bulk-priority?${filterParams}`, { priority })
      return res.data as { updatedCount: number }
    },
    onSuccess: () => {
      // Invalidate store products queries to refetch with new priorities
      queryClient.invalidateQueries({ queryKey: ["storeProducts"] })
      // Refetch count to show updated state
      refetchCount()
    },
  })

  // Handle dialog open state change - reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when dialog closes (use setTimeout to avoid state update during render)
      setTimeout(() => {
        setSelectedPriority(null)
        updateMutation.reset()
      }, 150)
    }
  }

  const handleApply = () => {
    if (selectedPriority === null) return
    updateMutation.mutate(selectedPriority)
  }

  const matchingCount = countData?.count ?? 0
  const isSuccess = updateMutation.isSuccess
  const updatedCount = updateMutation.data?.updatedCount ?? 0

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

          {/* Matching Count */}
          <div className="rounded-md border p-3">
            <Label className="text-muted-foreground text-xs font-medium uppercase">Products to Update</Label>
            <div className="mt-1">
              {isLoadingCount ? (
                <Skeleton className="h-6 w-20" />
              ) : countError ? (
                <span className="text-destructive text-sm">Error loading count</span>
              ) : (
                <span className="text-2xl font-bold">{matchingCount.toLocaleString()}</span>
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

          {/* Warning */}
          {selectedPriority !== null && !isSuccess && matchingCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This will update <strong>{matchingCount.toLocaleString()}</strong> products to priority{" "}
                <strong>{selectedPriority}</strong> and mark them as manually reviewed.
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
                disabled={selectedPriority === null || matchingCount === 0 || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Apply to ${matchingCount.toLocaleString()} products`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
