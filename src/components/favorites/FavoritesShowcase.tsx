"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  useFavoritesFiltered,
  type FavoritesQueryParams,
  type FavoritesSortType,
  type FavoritesSummary,
} from "@/hooks/useFavoritesFiltered"
import { searchTypes, type SearchType } from "@/types/business"
import { cn, getCenteredArray } from "@/lib/utils"

import { useScrollDirection } from "@/hooks/useScrollDirection"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"
import { SearchContainer } from "@/components/layout/search"
import { getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  HeartIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SearchIcon,
  TrendingDownIcon,
  TicketPercentIcon,
} from "lucide-react"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { FAVORITES_SORT_OPTIONS_GROUPS, FAVORITES_SMART_VIEW_PRESETS } from "@/lib/business/filters"

const SEARCH_DEBOUNCE_MS = 400

// ============================================================================
// URL State Management
// ============================================================================

function useUrlState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlState = useMemo(
    () => ({
      page: parseInt(searchParams.get("page") ?? "1", 10),
      sortBy: (searchParams.get("sort") ?? "recently-added") as FavoritesSortType,
      origin: searchParams.get("origin"),
      searchType: (searchParams.get("t") ?? "any") as SearchType,
      query: searchParams.get("q") ?? "",
      onlyDiscounted: searchParams.get("discounted") === "true",
      priceChange: (searchParams.get("pc") as "drop" | "increase") || null,
    }),
    [searchParams],
  )

  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        const shouldRemove =
          value === undefined ||
          value === null ||
          value === "" ||
          (key === "page" && value === 1) ||
          (key === "sort" && value === "recently-added") ||
          (key === "t" && value === "any") ||
          (key === "discounted" && value === false) ||
          (key === "pc" && value === false)

        if (shouldRemove) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }

      const queryString = params.toString()
      router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
    },
    [searchParams, router],
  )

  return { urlState, updateUrl }
}

// ============================================================================
// Build Query Params from URL State
// ============================================================================

function buildQueryParams(urlState: ReturnType<typeof useUrlState>["urlState"], limit: number): FavoritesQueryParams {
  const params: FavoritesQueryParams = {
    pagination: { page: urlState.page, limit },
    sort: { sortBy: urlState.sortBy },
    flags: {
      onlyDiscounted: urlState.onlyDiscounted,
      ...(urlState.priceChange && { priceChange: urlState.priceChange }),
    },
  }

  if (urlState.query) {
    params.search = { query: urlState.query, searchIn: urlState.searchType }
  }

  if (urlState.origin) {
    const originIds = urlState.origin
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v))

    if (originIds.length === 1) {
      params.origin = { originIds: originIds[0] }
    } else if (originIds.length > 1) {
      params.origin = { originIds }
    }
  }

  return params
}

// ============================================================================
// Parse helper functions
// ============================================================================

const parseArrayParam = (param: string | null): number[] => {
  if (!param) return []
  return param
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v))
}

const serializeArray = (arr: number[]): string | null => {
  if (arr.length === 0) return null
  return arr.join(",")
}

// ============================================================================
// Favorites Showcase Component
// ============================================================================

export function FavoritesShowcase({ limit = 24, children }: { limit?: number; children?: React.ReactNode }) {
  const router = useRouter()
  const { urlState, updateUrl } = useUrlState()

  const [queryInput, setQueryInput] = useState(urlState.query)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedOrigins = useMemo(() => parseArrayParam(urlState.origin), [urlState.origin])

  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  const {
    data: favorites,
    pagination,
    summary,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFavoritesFiltered(queryParams)

  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  // Debounced search: update URL after typing stops
  useEffect(() => {
    if (queryInput === urlState.query) return
    debounceRef.current = setTimeout(() => {
      updateUrl({ q: queryInput, page: 1 })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [queryInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setMobileFiltersOpen(false)
    updateUrl({ q: queryInput, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSortChange = (newSort: FavoritesSortType) => {
    updateUrl({ sort: newSort, page: 1 })
  }

  const handleSearchTypeChange = (newType: SearchType) => {
    updateUrl({ t: newType })
  }

  const handleOriginToggle = (originId: number) => {
    const isSelected = selectedOrigins.includes(originId)
    const updated = isSelected ? selectedOrigins.filter((v) => v !== originId) : [...selectedOrigins, originId]
    updateUrl({ origin: serializeArray(updated), page: 1 })
  }

  const handleClearOrigins = () => {
    updateUrl({ origin: null, page: 1 })
  }

  const handleClearFilters = () => {
    setQueryInput("")
    router.push(window.location.pathname)
  }

  const handlePresetApply = (params: Record<string, string | number | boolean | null>) => {
    updateUrl({ ...params, page: 1 })
  }

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = pagination?.totalPages ?? 0
  const totalCount = pagination?.totalCount ?? 0
  const currentPage = urlState.page

  const showingFrom = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0
  const showingTo = Math.min(currentPage * limit, totalCount)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (urlState.sortBy !== "recently-added") count++
    if (selectedOrigins.length > 0) count++
    if (urlState.onlyDiscounted) count++
    if (urlState.priceChange) count++
    return count
  }, [urlState.sortBy, selectedOrigins.length, urlState.onlyDiscounted, urlState.priceChange])

  const showSkeletons = isLoading && favorites.length === 0
  const showOverlay = isFetching && favorites.length > 0

  if (isError) {
    return (
      <div className="flex flex-1 items-start justify-center p-4">
        <ErrorStateView error={error} onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col lg:h-full lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden h-full flex-col overflow-y-auto border-r p-4 lg:flex lg:w-80 lg:min-w-80">
        <div className="mb-2 flex items-center gap-2">
          <HeartIcon className="fill-destructive stroke-destructive size-5" />
          <h2 className="text-lg font-bold">My Favorites</h2>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          Products you&apos;ve saved for easy access and price tracking
        </p>

        {/* Search Input (debounced) */}
        <div className="relative w-full">
          {isFetching ? (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : (
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          )}
          <Input
            type="text"
            placeholder="Search favorites..."
            className="pr-16 pl-8 text-base md:text-sm"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Select value={urlState.searchType} onValueChange={(v) => handleSearchTypeChange(v as SearchType)}>
            <SelectTrigger className="text-muted-foreground bg-background hover:bg-primary hover:text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground absolute top-1/2 right-2 flex h-4 w-auto -translate-y-1/2 items-center justify-center border-0 py-2 pr-0 pl-1 text-xs shadow-none transition">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent align="start" className="w-[180px]">
              <SelectGroup>
                <SelectLabel>Search by</SelectLabel>
                <SelectSeparator />
                {searchTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats + Count */}
        <div className="mt-2 flex flex-col gap-2">
          {showSkeletons ? (
            <Skeleton className="h-4 w-full rounded-md" />
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{totalCount}</strong> favorites
                {urlState.query && ` matching "${urlState.query}"`}
                {showOverlay && (
                  <span className="text-muted-foreground ml-2 inline-flex items-center gap-1">
                    <Loader2Icon className="h-3 w-3 animate-spin" />
                  </span>
                )}
              </p>
              {summary && (summary.onSale > 0 || summary.priceDrops > 0) && (
                <SummaryStatButtons summary={summary} urlState={urlState} onApply={handlePresetApply} />
              )}
            </>
          )}

          {/* Filters Accordion */}
          <Accordion type="multiple" className="w-full border-t" defaultValue={["sort", "store-origin"]}>
            {/* Store Origin Filter */}
            <AccordionItem value="store-origin">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                <span>Store Origin</span>
                {selectedOrigins.length > 0 && (
                  <>
                    <span className="text-muted-foreground text-xs">({selectedOrigins.length})</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClearOrigins()
                      }}
                      className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                    >
                      Clear
                    </span>
                  </>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="origin-continente"
                      checked={selectedOrigins.includes(1)}
                      onCheckedChange={() => handleOriginToggle(1)}
                    />
                    <Label
                      htmlFor="origin-continente"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <ContinenteSvg className="h-4 min-h-4 w-auto" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="origin-auchan"
                      checked={selectedOrigins.includes(2)}
                      onCheckedChange={() => handleOriginToggle(2)}
                    />
                    <Label
                      htmlFor="origin-auchan"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <AuchanSvg className="h-4 min-h-4 w-auto" />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="origin-pingo-doce"
                      checked={selectedOrigins.includes(3)}
                      onCheckedChange={() => handleOriginToggle(3)}
                    />
                    <Label
                      htmlFor="origin-pingo-doce"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <PingoDoceSvg className="h-4 min-h-4 w-auto" />
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sort Options */}
            <AccordionItem value="sort">
              <AccordionTrigger className="cursor-pointer justify-start gap-2 py-2 text-sm font-medium hover:no-underline">
                <span className="flex flex-1 items-center gap-1">
                  <span>Sort By</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-px pb-3">
                <div className="flex flex-col gap-1">
                  {FAVORITES_SORT_OPTIONS_GROUPS.map((group, gi) => (
                    <div key={group.label} className="flex flex-col gap-1">
                      <p
                        className={cn(
                          "text-muted-foreground mb-0 px-1.5 text-[11px] font-medium tracking-wider uppercase",
                          gi > 0 && "mt-1",
                        )}
                      >
                        {group.label}
                      </p>
                      {group.options.map((option) => (
                        <Button
                          key={option.value}
                          onClick={() => handleSortChange(option.value as FavoritesSortType)}
                          variant={urlState.sortBy === option.value ? "primary-soft" : "ghost"}
                          className="w-full justify-start"
                        >
                          <option.icon className="h-4 w-4 shrink-0" />
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNav
        query={urlState.query}
        isFetching={isFetching}
        totalCount={totalCount}
        activeFilterCount={activeFilterCount}
        onFilterPress={() => setMobileFiltersOpen(true)}
      />

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        urlState={urlState}
        selectedOrigins={selectedOrigins}
        onOriginToggle={handleOriginToggle}
        onClearOrigins={handleClearOrigins}
        onSortChange={handleSortChange}
        onPresetApply={handlePresetApply}
        summary={summary}
      />

      {/* Main Content Area */}
      <div data-main-scroll className="flex w-full flex-1 flex-col p-4 lg:h-full lg:overflow-y-auto">
        {showSkeletons ? (
          <LoadingGrid limit={limit} />
        ) : favorites.length > 0 ? (
          <>
            {/* Smart View Presets (desktop only: mobile presets are in MobileNav) */}
            <div className="hidden lg:block">
              <FavoritesSmartViewPresets urlState={urlState} isLoading={isFetching} onApply={handlePresetApply} />
            </div>

            {/* Status Bar - Desktop with inline pagination */}
            <div className="text-muted-foreground mb-4 hidden items-center justify-between text-xs lg:flex">
              <span>
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="text-foreground font-semibold">{totalCount}</span> favorites
              </span>
              {totalPages > 1 && (
                <div className="max-w-48">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>

            {/* Products grid with loading overlay */}
            <div className="relative">
              {showOverlay && (
                <div className="bg-background/60 absolute inset-0 z-10 flex items-start justify-center pt-24 backdrop-blur-[2px]">
                  <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              )}

              <ProductGridWrapper
                className={cn("w-full transition-opacity duration-200", showOverlay && "pointer-events-none")}
              >
                {favorites.map((favorite, idx) => (
                  <StoreProductCard
                    key={favorite.id}
                    sp={favorite.store_products}
                    imagePriority={idx < 12}
                    favoritedAt={favorite.created_at}
                  />
                ))}
              </ProductGridWrapper>
            </div>

            {/* Bottom Pagination */}
            <BottomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />

            {/* Footer passed as children */}
            {children}
          </>
        ) : (
          <EmptyState query={urlState.query} onClearFilters={handleClearFilters} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function MobileNav({
  query,
  isFetching,
  totalCount,
  activeFilterCount,
  onFilterPress,
}: {
  query: string
  isFetching: boolean
  totalCount: number
  activeFilterCount: number
  onFilterPress: () => void
}) {
  const scrollDirection = useScrollDirection()
  const hidden = scrollDirection === "down"

  return (
    <div
      className={cn(
        "sticky top-(--header-height) z-50 grid transition-[grid-template-rows] duration-300 ease-in-out lg:hidden",
        hidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
      )}
    >
      <nav className="overflow-hidden">
        <div className="mx-auto flex w-full items-center gap-2 border-b bg-white/95 px-4 py-2.5 backdrop-blur backdrop-filter dark:bg-zinc-950/95">
          <SearchContainer initialQuery={query} registerKeyboardShortcut={false}>
            <button
              type="button"
              className="active:bg-accent flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5"
            >
              {isFetching ? (
                <Loader2Icon className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              <span
                className={cn("flex-1 truncate text-left text-sm", query ? "text-foreground" : "text-muted-foreground")}
              >
                {query || "Search favorites..."}
              </span>
              {totalCount > 0 && (
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{totalCount}</span>
              )}
            </button>
          </SearchContainer>
          <button
            type="button"
            onClick={onFilterPress}
            className="active:bg-accent relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          >
            <FilterIcon className="text-muted-foreground h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  )
}

// ============================================================================
// Mobile Filters Drawer (drill-down)
// ============================================================================

const STORE_OPTIONS = [
  { id: 1, Logo: ContinenteSvg },
  { id: 2, Logo: AuchanSvg },
  { id: 3, Logo: PingoDoceSvg },
] as const

function storeOriginSummary(selectedOrigins: number[]): string {
  if (selectedOrigins.length === 0) return "All stores"
  return selectedOrigins
    .map((id) => getSupermarketChainName(id))
    .filter(Boolean)
    .join(", ")
}

type FavDrawerView = "main" | "sort" | "store"

interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  urlState: ReturnType<typeof useUrlState>["urlState"]
  selectedOrigins: number[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onSortChange: (sort: FavoritesSortType) => void
  onPresetApply: (params: Record<string, string | number | boolean | null>) => void
  summary: FavoritesSummary | null
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  urlState,
  selectedOrigins,
  onOriginToggle,
  onClearOrigins,
  onSortChange,
  onPresetApply,
  summary,
}: MobileFiltersDrawerProps) {
  const [view, setView] = useState<FavDrawerView>("main")

  useEffect(() => {
    if (!open) setView("main")
  }, [open])

  const sortLabel =
    FAVORITES_SORT_OPTIONS_GROUPS.flatMap((g) => g.options).find((o) => o.value === urlState.sortBy)?.label ??
    "Recently Added"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85svh] lg:hidden">
        {view === "sort" ? (
          <FavMobileSortView
            currentSort={urlState.sortBy}
            onSelect={(sort) => {
              onSortChange(sort)
              setView("main")
            }}
            onBack={() => setView("main")}
          />
        ) : view === "store" ? (
          <FavMobileStoreView
            selectedOrigins={selectedOrigins}
            onOriginToggle={onOriginToggle}
            onClearOrigins={onClearOrigins}
            onBack={() => setView("main")}
          />
        ) : (
          <FavMobileMainView
            sortLabel={sortLabel}
            storeSummary={storeOriginSummary(selectedOrigins)}
            activeFilterCount={
              (urlState.sortBy !== "recently-added" ? 1 : 0) +
              (selectedOrigins.length > 0 ? 1 : 0) +
              (urlState.onlyDiscounted ? 1 : 0)
            }
            urlState={urlState}
            summary={summary}
            isFetching={false}
            onViewChange={setView}
            onPresetApply={onPresetApply}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}

function FavSubViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <button
        type="button"
        onClick={onBack}
        className="active:bg-accent -ml-1 flex h-8 w-8 items-center justify-center rounded-full"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}

function FavFilterSummaryRow({
  label,
  value,
  onClick,
  isLast,
}: {
  label: string
  value: string
  onClick: () => void
  isLast?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center justify-between py-4", !isLast && "border-b")}
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground text-xs">{value}</span>
      </div>
      <ChevronRightIcon className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  )
}

function FavMobileMainView({
  sortLabel,
  storeSummary,
  activeFilterCount,
  urlState,
  summary,
  isFetching,
  onViewChange,
  onPresetApply,
}: {
  sortLabel: string
  storeSummary: string
  activeFilterCount: number
  urlState: { sortBy: FavoritesSortType; onlyDiscounted: boolean; priceChange: string | null }
  summary: FavoritesSummary | null
  isFetching: boolean
  onViewChange: (view: FavDrawerView) => void
  onPresetApply: (params: Record<string, string | number | boolean | null>) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-lg font-semibold">Filters & Sort</h2>
        {activeFilterCount > 0 && (
          <span className="text-foreground bg-accent dark:bg-primary/20 rounded-full px-1.5 py-0.5 text-xs font-medium">
            {activeFilterCount} active
          </span>
        )}
      </div>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto border-t px-4">
        <FavFilterSummaryRow label="Sort By" value={sortLabel} onClick={() => onViewChange("sort")} />
        <FavFilterSummaryRow label="Store" value={storeSummary} onClick={() => onViewChange("store")} isLast />

        {summary && (summary.onSale > 0 || summary.priceDrops > 0) && (
          <div className="pt-4">
            <SummaryStatButtons summary={summary} urlState={urlState} onApply={onPresetApply} />
          </div>
        )}

        <div className="pt-3">
          <FavoritesSmartViewPresets urlState={urlState} isLoading={isFetching} onApply={onPresetApply} />
        </div>
      </div>
    </div>
  )
}

function FavMobileSortView({
  currentSort,
  onSelect,
  onBack,
}: {
  currentSort: FavoritesSortType
  onSelect: (sort: FavoritesSortType) => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <FavSubViewHeader title="Sort By" onBack={onBack} />
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        <RadioGroup value={currentSort} onValueChange={(v) => onSelect(v as FavoritesSortType)} className="gap-0">
          {FAVORITES_SORT_OPTIONS_GROUPS.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "border-border mt-2 border-t pt-2")}>
              <span className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wider uppercase">
                {group.label}
              </span>
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors",
                    currentSort === option.value && "bg-accent dark:bg-primary/20",
                  )}
                >
                  <option.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="flex-1 text-[15px]">{option.label}</span>
                  <RadioGroupItem value={option.value} className="shrink-0" />
                </label>
              ))}
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

function FavMobileStoreView({
  selectedOrigins,
  onOriginToggle,
  onClearOrigins,
  onBack,
}: {
  selectedOrigins: number[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="active:bg-accent -ml-1 flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-lg font-semibold">Store</h2>
        {selectedOrigins.length > 0 && (
          <button onClick={onClearOrigins} className="text-muted-foreground text-xs font-medium hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        {STORE_OPTIONS.map(({ id, Logo }) => {
          const checked = selectedOrigins.includes(id)
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-3.5 transition-colors",
                checked ? "bg-accent dark:bg-primary/20" : "hover:bg-accent",
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => onOriginToggle(id)} />
              <Logo className="h-5 min-h-5 w-auto" />
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Summary Stat Buttons (interactive preset toggles)
// ============================================================================

const STAT_PRESETS = {
  onSale: { discounted: "true" },
  priceDrops: { pc: "drop" },
} as const

function SummaryStatButtons({
  summary,
  urlState,
  onApply,
}: {
  summary: FavoritesSummary
  urlState: { onlyDiscounted: boolean; priceChange: string | null }
  onApply: (params: Record<string, string | number | boolean | null>) => void
}) {
  const onSaleActive = urlState.onlyDiscounted
  const priceDropsActive = urlState.priceChange === "drop"

  const toggle = (presetParams: Record<string, string>, active: boolean) => {
    if (active) {
      const revert: Record<string, null> = {}
      for (const key of Object.keys(presetParams)) revert[key] = null
      onApply(revert)
    } else {
      onApply(presetParams)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {summary.onSale > 0 && (
        <button
          type="button"
          onClick={() => toggle(STAT_PRESETS.onSale as Record<string, string>, onSaleActive)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all",
            onSaleActive
              ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/40 dark:text-emerald-400 dark:ring-emerald-400/40"
              : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
          )}
        >
          <TicketPercentIcon className="h-3 w-3" />
          {summary.onSale} on sale
        </button>
      )}
      {summary.priceDrops > 0 && (
        <button
          type="button"
          onClick={() => toggle(STAT_PRESETS.priceDrops as Record<string, string>, priceDropsActive)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all",
            priceDropsActive
              ? "bg-blue-500/20 text-blue-600 ring-1 ring-blue-500/40 dark:text-blue-400 dark:ring-blue-400/40"
              : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
          )}
        >
          <TrendingDownIcon className="h-3 w-3" />
          {summary.priceDrops} price drops
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Smart View Presets
// ============================================================================

function FavoritesSmartViewPresets({
  urlState,
  isLoading,
  onApply,
}: {
  urlState: { onlyDiscounted: boolean; priceChange: string | null }
  isLoading?: boolean
  onApply: (params: Record<string, string | number | boolean | null>) => void
}) {
  const isPresetActive = (preset: (typeof FAVORITES_SMART_VIEW_PRESETS)[number]) => {
    return Object.entries(preset.params).every(([key, value]) => {
      if (key === "discounted") return urlState.onlyDiscounted === (value === "true")
      if (key === "pc") return urlState.priceChange === value
      return false
    })
  }

  return (
    <div className="no-scrollbar mb-3 flex h-8 max-h-8 min-h-8 flex-1 gap-2 self-stretch overflow-x-auto">
      {FAVORITES_SMART_VIEW_PRESETS.map((preset) => {
        const active = isPresetActive(preset)
        return (
          <button
            key={preset.label}
            onClick={() => {
              if (active) {
                const revert: Record<string, null> = {}
                for (const key of Object.keys(preset.params)) {
                  revert[key] = null
                }
                onApply(revert)
              } else {
                onApply(preset.params as Record<string, string>)
              }
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "from-primary/80 to-secondary/80 text-primary-foreground shadow-primary/25 dark:from-primary/60 dark:to-secondary/60 dark:shadow-primary/15 bg-linear-to-br shadow-none"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-foreground dark:bg-muted dark:hover:bg-accent",
            )}
          >
            {active && isLoading ? (
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <preset.icon className="h-3.5 w-3.5" />
            )}
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Shared UI Components
// ============================================================================

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  return (
    <div className="isolate flex flex-1 -space-x-px">
      <Button
        variant="outline"
        className="rounded-r-none focus:z-10"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </Button>
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
      <Button
        variant="outline"
        className="rounded-l-none focus:z-10"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

function LoadingGrid({ limit }: { limit: number }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <ProductGridWrapper className="w-full">
        {Array.from({ length: limit }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </ProductGridWrapper>
    </div>
  )
}

function EmptyState({ query, onClearFilters }: { query: string; onClearFilters: () => void }) {
  const router = useRouter()

  return (
    <div className="flex flex-1 items-start justify-center p-4">
      <EmptyStateView
        icon={HeartIcon}
        title={query ? "No favorites match your search" : "No favorites yet"}
        message={
          query
            ? `We couldn't find any favorites matching "${query}".`
            : "Start adding products to your favorites to see them here."
        }
        actions={
          query ? (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <RefreshCcwIcon className="size-4" />
              Clear filters
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push("/products")}>
              <SearchIcon className="size-4" />
              Find products
            </Button>
          )
        }
      />
    </div>
  )
}

function BottomPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalCount,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  showingFrom: number
  showingTo: number
  totalCount: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t py-4">
      <div className="text-muted-foreground flex w-full flex-col text-sm">
        <span>
          Showing <span className="text-foreground font-semibold">{showingFrom}</span> to{" "}
          <span className="text-foreground font-semibold">{showingTo}</span> of{" "}
          <span className="text-foreground font-semibold">{totalCount}</span> favorites
        </span>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
