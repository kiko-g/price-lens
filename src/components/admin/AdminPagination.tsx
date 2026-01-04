"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react"

export type AdminPaginationState = {
  page: number
  limit: number
}

export function useAdminPagination(defaultLimit = 50): AdminPaginationState {
  const searchParams = useSearchParams()

  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = parseInt(searchParams.get("limit") ?? String(defaultLimit), 10)

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? defaultLimit : limit,
  }
}

type AdminPaginationProps = {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export function AdminPagination({ page, limit, totalCount, totalPages }: AdminPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = (newPage: number, newLimit?: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    if (newLimit) {
      params.set("limit", String(newLimit))
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateParams(newPage)
    }
  }

  const changeLimit = (newLimit: string) => {
    updateParams(1, parseInt(newLimit, 10))
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, totalCount)

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-muted-foreground text-sm">
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalCount}</span> results
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Rows:</span>
            <Select value={String(limit)} onValueChange={changeLimit}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => goToPage(1)} disabled={page === 1}>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => goToPage(page - 1)} disabled={page === 1}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <span className="text-muted-foreground mx-2 text-sm">
              Page {page} of {totalPages}
            </span>

            <Button variant="outline" size="icon-sm" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
