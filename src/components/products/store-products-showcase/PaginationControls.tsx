import { useTranslations } from "next-intl"
import { cn, getCenteredArray } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number | null
  hasNextPage: boolean
  isLoading: boolean
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  isLoading,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const isNextDisabled = isLoading || !hasNextPage
  const t = useTranslations("products.pagination")

  return (
    <div className={cn("text-foreground isolate flex items-center gap-1 md:gap-2", className)}>
      <Button
        size="sm"
        variant="ghost"
        className="focus:z-10 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {t("previous")}
      </Button>

      {totalPages != null ? (
        <Select value={currentPage.toString()} onValueChange={(v) => onPageChange(parseInt(v, 10))}>
          <SelectTrigger className="w-auto justify-center rounded-none font-medium lg:w-full">
            <SelectValue placeholder={currentPage} />
          </SelectTrigger>
          <SelectContent>
            {getCenteredArray(Math.min(totalPages, 50), currentPage, totalPages || null).map((num: number) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="bg-foreground text-background flex h-4 w-auto min-w-4 items-center justify-center rounded-full px-1 text-xs font-medium">
          {currentPage}
        </span>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="focus:z-10 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
      >
        {t("next")}
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function BottomPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalCount,
  hasNextPage,
  onPageChange,
}: {
  currentPage: number
  totalPages: number | null
  showingFrom: number
  showingTo: number
  totalCount: number | null
  hasNextPage: boolean
  onPageChange: (page: number) => void
}) {
  const t = useTranslations("products.pagination")
  return (
    <div className="mt-8 flex items-center justify-between border-t py-4">
      <div className="text-muted-foreground flex w-full flex-col text-sm">
        <span>
          {totalCount != null
            ? t.rich("showingOfTotal", {
                from: showingFrom,
                to: showingTo,
                total: totalCount,
                strong: (chunks) => <span className="text-foreground font-semibold">{chunks}</span>,
              })
            : t.rich("showingNoTotal", {
                from: showingFrom,
                to: showingTo,
                strong: (chunks) => <span className="text-foreground font-semibold">{chunks}</span>,
              })}
        </span>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        isLoading={false}
        onPageChange={onPageChange}
      />
    </div>
  )
}
