"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PriorityBubble } from "@/components/products/PriorityBubble"

import { RefreshCwIcon, AlertTriangleIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "lucide-react"

import { useActivityLog } from "@/hooks/useActivityLog"

const PAGE_SIZE = 25

export function ScrapeHistorySection() {
  const [page, setPage] = useState(1)

  const {
    data: activityLog,
    isLoading,
    refetch,
  } = useActivityLog({
    page,
    limit: PAGE_SIZE,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClockIcon className="h-5 w-5" />
              Scrape History
            </CardTitle>
            <CardDescription>
              {activityLog?.pagination
                ? `${activityLog.pagination.totalCount.toLocaleString()} products have been scraped`
                : "Complete log of all scraped products"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activityLog?.products && activityLog.products.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-12 p-3 text-left font-medium">#</th>
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="w-32 p-3 text-left font-medium">Priority</th>
                    <th className="w-40 p-3 text-right font-medium">Last Scraped</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activityLog.products.map((product, idx) => {
                    const rowNumber = (page - 1) * PAGE_SIZE + idx + 1
                    return (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="text-muted-foreground p-3 font-mono text-xs">{rowNumber}</td>
                        <td className="p-3">
                          <span className="line-clamp-1 font-medium">{product.name || `Product #${product.id}`}</span>
                        </td>
                        <td className="p-3">
                          <PriorityBubble priority={product.priority} size="sm" useDescription />
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
                              </TooltipTrigger>
                              <TooltipContent>{format(new Date(product.updated_at), "PPpp")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {activityLog.pagination && activityLog.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(page * PAGE_SIZE, activityLog.pagination.totalCount)}</span>{" "}
                  of <span className="font-medium">{activityLog.pagination.totalCount.toLocaleString()}</span> products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, activityLog.pagination.totalPages) }, (_, i) => {
                      const totalPages = activityLog.pagination.totalPages
                      let pageNum: number

                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(activityLog.pagination.totalPages, p + 1))}
                    disabled={!activityLog.pagination.hasMore}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <AlertTriangleIcon className="mb-2 h-8 w-8 text-amber-500" />
            <h4 className="font-medium">No scraping history yet</h4>
            <p className="text-muted-foreground text-sm">
              Products will appear here once the scheduler starts scraping.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
