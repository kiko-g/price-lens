"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { useStoreProducts, SupermarketChain, type StoreProductsQueryParams } from "@/hooks/useStoreProducts"
import { searchTypes, type SearchType, type SortByType } from "@/types/extra"
import { cn, getCenteredArray } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { BorderBeam } from "@/components/ui/magic/border-beam"

import { StoreProductCard } from "@/components/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/StoreProductCardSkeleton"
import { SectionWrapper } from "@/components/ui/combo/section-wrapper"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"

import {
  ArrowDownAZ,
  ArrowDownAZIcon,
  ArrowDownWideNarrowIcon,
  ArrowUpAZ,
  ArrowUpAZIcon,
  ArrowUpWideNarrowIcon,
  BadgePercentIcon,
  CheckIcon,
  CircleOffIcon,
  CrownIcon,
  FilterIcon,
  HomeIcon,
  MicroscopeIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react"

// ============================================================================
// Priority Configuration (same as PriorityBadge)
// ============================================================================

const PRIORITY_CONFIG = {
  0: { label: "Useless", shortLabel: "0", color: "bg-gray-800", textColor: "text-white" },
  1: { label: "Minor", shortLabel: "1", color: "bg-rose-600", textColor: "text-white" },
  2: { label: "Low", shortLabel: "2", color: "bg-orange-600", textColor: "text-white" },
  3: { label: "Medium", shortLabel: "3", color: "bg-amber-600", textColor: "text-white" },
  4: { label: "Important", shortLabel: "4", color: "bg-sky-600", textColor: "text-white" },
  5: { label: "Essential", shortLabel: "5", color: "bg-emerald-700", textColor: "text-white" },
} as const

type PriorityLevel = keyof typeof PRIORITY_CONFIG

// ============================================================================
// Types
// ============================================================================

interface StoreProductsShowcaseProps {
  /** Default page limit */
  limit?: number
}

// ============================================================================
// URL State Management
// ============================================================================

function useUrlState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read URL params as source of truth
  const urlState = useMemo(
    () => ({
      page: parseInt(searchParams.get("page") ?? "1", 10),
      sortBy: (searchParams.get("sort") ?? "a-z") as SortByType,
      origin: searchParams.get("origin"),
      searchType: (searchParams.get("t") ?? "any") as SearchType,
      query: searchParams.get("q") ?? "",
      orderByPriority: searchParams.get("priority_order") === "true",
      onlyDiscounted: searchParams.get("discounted") === "true",
      priority: searchParams.get("priority") ?? "",
      // Category hierarchy
      category: searchParams.get("cat") ?? "",
      category2: searchParams.get("cat2") ?? "",
      category3: searchParams.get("cat3") ?? "",
    }),
    [searchParams],
  )

  // Update URL params
  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        // Remove params that should be hidden (defaults or empty)
        const shouldRemove =
          value === undefined ||
          value === null ||
          value === "" ||
          (key === "page" && value === 1) ||
          (key === "sort" && value === "a-z") ||
          (key === "t" && value === "any") ||
          (key === "priority_order" && value === false) ||
          (key === "discounted" && value === false) ||
          (key === "priority" && value === "") ||
          (key === "cat" && value === "") ||
          (key === "cat2" && value === "") ||
          (key === "cat3" && value === "")

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

function buildQueryParams(
  urlState: ReturnType<typeof useUrlState>["urlState"],
  limit: number,
): StoreProductsQueryParams {
  const params: StoreProductsQueryParams = {
    pagination: { page: urlState.page, limit },
    sort: {
      sortBy: urlState.sortBy,
      prioritizeByPriority: urlState.orderByPriority,
    },
    flags: {
      excludeEmptyNames: true,
      onlyDiscounted: urlState.onlyDiscounted,
    },
  }

  // Search
  if (urlState.query) {
    params.search = { query: urlState.query, searchIn: urlState.searchType }
  }

  // Origin
  if (urlState.origin) {
    const originIds = urlState.origin
      .split(",")
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v)) as SupermarketChain[]

    if (originIds.length === 1) {
      params.origin = { originIds: originIds[0] }
    } else if (originIds.length > 1) {
      params.origin = { originIds }
    }
  }

  // Priority filter
  if (urlState.priority) {
    const priorityValues = urlState.priority
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v) && v >= 0 && v <= 5)

    if (priorityValues.length > 0) {
      params.priority = { values: priorityValues }
    }
  }

  // Category hierarchy filter
  if (urlState.category || urlState.category2 || urlState.category3) {
    params.categories = {
      hierarchy: {
        category1: urlState.category || undefined,
        category2: urlState.category2 || undefined,
        category3: urlState.category3 || undefined,
      },
    }
  }

  return params
}

// ============================================================================
// Main Component
// ============================================================================

export function StoreProductsShowcase({ limit = 36 }: StoreProductsShowcaseProps) {
  const { urlState, updateUrl } = useUrlState()

  // Local input state (only synced on submit)
  const [queryInput, setQueryInput] = useState(urlState.query)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Build query params from URL state
  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  // Fetch products
  const { data: products, pagination, isLoading, isError, refetch } = useStoreProducts(queryParams)

  // Sync local query input when URL changes
  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearch = () => {
    setMobileFiltersOpen(false)
    updateUrl({ q: queryInput, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage })
  }

  const handleSortChange = (newSort: SortByType) => {
    updateUrl({ sort: newSort })
  }

  const handleOriginChange = (newOrigin: string | null) => {
    updateUrl({ origin: newOrigin, page: 1 })
  }

  const handleSearchTypeChange = (newType: SearchType) => {
    updateUrl({ t: newType })
  }

  const handleTogglePriorityOrder = () => {
    updateUrl({ priority_order: !urlState.orderByPriority })
  }

  const handleToggleDiscounted = () => {
    updateUrl({ discounted: !urlState.onlyDiscounted })
  }

  // Parse current priority selection
  const selectedPriorities = useMemo(() => {
    if (!urlState.priority) return new Set<number>()
    return new Set(
      urlState.priority
        .split(",")
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => !isNaN(v) && v >= 0 && v <= 5),
    )
  }, [urlState.priority])

  const handlePriorityToggle = (level: number) => {
    const newSelected = new Set(selectedPriorities)
    if (newSelected.has(level)) {
      newSelected.delete(level)
    } else {
      newSelected.add(level)
    }

    const priorityString = Array.from(newSelected).sort().join(",")
    updateUrl({ priority: priorityString, page: 1 })
  }

  const handleClearPriority = () => {
    updateUrl({ priority: "", page: 1 })
  }

  // Category handlers
  const handleCategoryChange = (category: string) => {
    // When category changes, clear child categories
    updateUrl({ cat: category, cat2: "", cat3: "", page: 1 })
  }

  const handleCategory2Change = (category2: string) => {
    // When category2 changes, clear category3
    updateUrl({ cat2: category2, cat3: "", page: 1 })
  }

  const handleCategory3Change = (category3: string) => {
    updateUrl({ cat3: category3, page: 1 })
  }

  const handleClearCategories = () => {
    updateUrl({ cat: "", cat2: "", cat3: "", page: 1 })
  }

  const handleClearFilters = () => {
    setQueryInput("")
    router.push(window.location.pathname)
  }

  const router = useRouter()

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = pagination?.totalPages ?? 0
  const totalCount = pagination?.totalCount ?? 0
  const currentPage = urlState.page

  const showingFrom = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0
  const showingTo = Math.min(currentPage * limit, totalCount)

  // ============================================================================
  // Render
  // ============================================================================

  if (isError) {
    return (
      <SectionWrapper>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching products. Please try again.</p>
        <Button variant="default" onClick={() => refetch()}>
          <span>Try again</span>
          <RefreshCcwIcon />
        </Button>
      </SectionWrapper>
    )
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-0">
      {/* Desktop Navigation */}
      <DesktopNav
        urlState={urlState}
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        onSearch={handleSearch}
        onSortChange={handleSortChange}
        onOriginChange={handleOriginChange}
        onSearchTypeChange={handleSearchTypeChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleDiscounted={handleToggleDiscounted}
        onPageChange={handlePageChange}
        onClearFilters={handleClearFilters}
        selectedPriorities={selectedPriorities}
        onPriorityToggle={handlePriorityToggle}
        onClearPriority={handleClearPriority}
        onCategoryChange={handleCategoryChange}
        onCategory2Change={handleCategory2Change}
        onCategory3Change={handleCategory3Change}
        onClearCategories={handleClearCategories}
        isLoading={isLoading}
        totalPages={totalPages}
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalCount={totalCount}
      />

      {/* Mobile Navigation */}
      <MobileNav
        urlState={urlState}
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        onSearch={handleSearch}
        onSearchTypeChange={handleSearchTypeChange}
        isLoading={isLoading}
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        urlState={urlState}
        onSortChange={handleSortChange}
        onOriginChange={handleOriginChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleDiscounted={handleToggleDiscounted}
        onApply={handleSearch}
      />

      {/* Products Grid */}
      {isLoading ? (
        <LoadingGrid limit={limit} />
      ) : products.length > 0 ? (
        <div className="grid h-full w-full flex-1 grid-cols-2 gap-8 border-b px-4 pt-4 pb-16 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-6 2xl:grid-cols-8">
          {products.map((product, idx) => (
            <StoreProductCard key={product.id} sp={product} imagePriority={idx < 12} />
          ))}
        </div>
      ) : (
        <EmptyState query={urlState.query} onClearFilters={handleClearFilters} />
      )}

      {/* Bottom Pagination */}
      {!isLoading && totalCount > 0 && (
        <BottomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={showingFrom}
          showingTo={showingTo}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

interface DesktopNavProps {
  urlState: ReturnType<typeof useUrlState>["urlState"]
  queryInput: string
  setQueryInput: (value: string) => void
  onSearch: () => void
  onSortChange: (sort: SortByType) => void
  onOriginChange: (origin: string | null) => void
  onSearchTypeChange: (type: SearchType) => void
  onTogglePriorityOrder: () => void
  onToggleDiscounted: () => void
  onPageChange: (page: number) => void
  onClearFilters: () => void
  selectedPriorities: Set<number>
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
  onCategoryChange: (category: string) => void
  onCategory2Change: (category2: string) => void
  onCategory3Change: (category3: string) => void
  onClearCategories: () => void
  isLoading: boolean
  totalPages: number
  showingFrom: number
  showingTo: number
  totalCount: number
}

function DesktopNav({
  urlState,
  queryInput,
  setQueryInput,
  onSearch,
  onSortChange,
  onOriginChange,
  onSearchTypeChange,
  onTogglePriorityOrder,
  onToggleDiscounted,
  onPageChange,
  selectedPriorities,
  onPriorityToggle,
  onClearPriority,
  onCategoryChange,
  onCategory2Change,
  onCategory3Change,
  onClearCategories,
  isLoading,
  totalPages,
  showingFrom,
  showingTo,
  totalCount,
}: DesktopNavProps) {
  return (
    <nav className="sticky top-[54px] z-50 mx-auto hidden w-full flex-col gap-0 border-b bg-white/95 px-4 py-3 backdrop-blur backdrop-filter lg:flex dark:bg-zinc-950/95">
      <div className="flex w-full flex-col items-end justify-between gap-2 md:gap-6 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="flex w-full max-w-lg flex-1 gap-2">
          <div className="relative w-full">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-8 text-base md:text-sm"
              value={queryInput}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <Select value={urlState.searchType} onValueChange={(v) => onSearchTypeChange(v as SearchType)}>
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
        </div>

        {/* Filters & Pagination */}
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <div className="flex flex-1 gap-2">
            {/* Store Filter */}
            <StoreSelect value={urlState.origin} onChange={onOriginChange} />

            {/* Category Filter */}
            <CategoryCascadeFilter
              category={urlState.category}
              category2={urlState.category2}
              category3={urlState.category3}
              onCategoryChange={onCategoryChange}
              onCategory2Change={onCategory2Change}
              onCategory3Change={onCategory3Change}
              onClear={onClearCategories}
            />

            {/* Priority Filter */}
            <PriorityFilterDropdown
              selectedPriorities={selectedPriorities}
              onPriorityToggle={onPriorityToggle}
              onClearPriority={onClearPriority}
            />

            {/* Sort Menu */}
            <SortMenu
              sortBy={urlState.sortBy}
              orderByPriority={urlState.orderByPriority}
              onlyDiscounted={urlState.onlyDiscounted}
              onSortChange={onSortChange}
              onTogglePriorityOrder={onTogglePriorityOrder}
              onToggleDiscounted={onToggleDiscounted}
            />
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={urlState.page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={onPageChange}
          />

          <Button variant="primary" disabled={isLoading} onClick={onSearch} className="w-auto ring-0">
            Search
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      {totalCount > 0 && (
        <div className="text-muted-foreground mt-2 flex w-full items-center justify-between text-xs">
          <span>
            Showing{" "}
            <span className="text-foreground font-semibold">
              {showingFrom}-{showingTo}
            </span>{" "}
            of <span className="text-foreground font-semibold">{totalCount}</span> results
          </span>
          <span>
            Page <span className="text-foreground font-semibold">{urlState.page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
          </span>
        </div>
      )}
    </nav>
  )
}

interface MobileNavProps {
  urlState: ReturnType<typeof useUrlState>["urlState"]
  queryInput: string
  setQueryInput: (value: string) => void
  onSearch: () => void
  onSearchTypeChange: (type: SearchType) => void
  isLoading: boolean
  showingFrom: number
  showingTo: number
  totalCount: number
  currentPage: number
  totalPages: number
}

function MobileNav({
  urlState,
  queryInput,
  setQueryInput,
  onSearch,
  onSearchTypeChange,
  isLoading,
  showingFrom,
  showingTo,
  totalCount,
  currentPage,
  totalPages,
}: MobileNavProps) {
  return (
    <nav className="sticky top-[54px] z-50 mx-auto flex w-full flex-col gap-0 border-b bg-white/95 px-4 py-3 backdrop-blur backdrop-filter lg:hidden dark:bg-zinc-950/95">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pr-16 pl-8 text-base"
            value={queryInput}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <Select value={urlState.searchType} onValueChange={(v) => onSearchTypeChange(v as SearchType)}>
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
        <Button variant="primary" disabled={isLoading} onClick={onSearch} className="px-4">
          Search
        </Button>
      </div>

      {/* Status Bar */}
      {totalCount > 0 && (
        <div className="text-muted-foreground mt-2 flex w-full items-center justify-between text-xs">
          <span>
            Showing{" "}
            <span className="text-foreground font-semibold">
              {showingFrom}-{showingTo}
            </span>{" "}
            of <span className="text-foreground font-semibold">{totalCount}</span>
          </span>
          <span>
            Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
          </span>
        </div>
      )}
    </nav>
  )
}

interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  urlState: ReturnType<typeof useUrlState>["urlState"]
  onSortChange: (sort: SortByType) => void
  onOriginChange: (origin: string | null) => void
  onTogglePriorityOrder: () => void
  onToggleDiscounted: () => void
  onApply: () => void
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  urlState,
  onSortChange,
  onOriginChange,
  onTogglePriorityOrder,
  onToggleDiscounted,
  onApply,
}: MobileFiltersDrawerProps) {
  return (
    <>
      {/* Floating Button */}
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button
            size="icon-xl"
            className="fixed right-6 bottom-6 z-40 h-14 w-14 rounded-full shadow-lg lg:hidden"
            variant="default"
          >
            <FilterIcon />
            <BorderBeam
              duration={2}
              size={60}
              colorFrom="var(--color-secondary)"
              colorTo="var(--color-secondary)"
              borderWidth={3}
            />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="text-left">Filters & Sort</DrawerTitle>
          </DrawerHeader>
          <div className="mt-2 flex flex-col gap-6 border-t px-4 pt-2 pb-24">
            {/* Store Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Store</Label>
              <StoreSelect value={urlState.origin} onChange={onOriginChange} fullWidth />
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sort By</Label>
              <div className="grid grid-cols-1 gap-2">
                <SortButton
                  label="Name A-Z"
                  value="a-z"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<ArrowDownAZ className="h-4 w-4" />}
                />
                <SortButton
                  label="Name Z-A"
                  value="z-a"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<ArrowUpAZ className="h-4 w-4" />}
                />
                <SortButton
                  label="Price: High to Low"
                  value="price-high-low"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<ArrowUpWideNarrowIcon className="h-4 w-4" />}
                />
                <SortButton
                  label="Price: Low to High"
                  value="price-low-high"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<ArrowDownWideNarrowIcon className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Filter Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filter Options</Label>
              <div className="space-y-2">
                <ToggleButton
                  label="Only discounted"
                  icon={<BadgePercentIcon className="h-4 w-4" />}
                  active={urlState.onlyDiscounted}
                  onClick={onToggleDiscounted}
                />
                <ToggleButton
                  label="Order by priority"
                  icon={<CrownIcon className="h-4 w-4" />}
                  active={urlState.orderByPriority}
                  onClick={onTogglePriorityOrder}
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="absolute right-0 bottom-0 left-0 border-t bg-white p-4 dark:bg-zinc-950">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={onApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// ============================================================================
// Shared UI Components
// ============================================================================

function StoreSelect({
  value,
  onChange,
  fullWidth,
}: {
  value: string | null
  onChange: (v: string | null) => void
  fullWidth?: boolean
}) {
  return (
    <Select value={value ?? "0"} onValueChange={(v) => onChange(v === "0" ? null : v)}>
      <SelectTrigger className={cn("font-medium", fullWidth && "w-full")}>
        <SelectValue placeholder="Store" />
      </SelectTrigger>
      <SelectContent align="start" className="w-[180px]">
        <SelectGroup>
          <SelectLabel>Store</SelectLabel>
          <SelectItem value="0">All stores</SelectItem>
          <SelectItem value="1">
            <ContinenteSvg className="inline-flex h-4 min-h-4 w-auto" />
          </SelectItem>
          <SelectItem value="2">
            <AuchanSvg className="inline-flex h-4 min-h-4 w-auto" />
          </SelectItem>
          <SelectItem value="3">
            <PingoDoceSvg className="inline-flex h-4 min-h-4 w-auto" />
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

// ============================================================================
// Category Cascade Filter
// ============================================================================

interface CategoryCascadeFilterProps {
  category: string
  category2: string
  category3: string
  onCategoryChange: (category: string) => void
  onCategory2Change: (category2: string) => void
  onCategory3Change: (category3: string) => void
  onClear: () => void
}

function useCategoryOptions(category?: string, category2?: string) {
  // Fetch level 1 categories
  const { data: level1Data } = useQuery({
    queryKey: ["categories", "hierarchy", "level1"],
    queryFn: async () => {
      const res = await axios.get("/api/categories/hierarchy")
      return res.data.options as string[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  // Fetch level 2 categories (based on category)
  const { data: level2Data } = useQuery({
    queryKey: ["categories", "hierarchy", "level2", category],
    queryFn: async () => {
      const res = await axios.get("/api/categories/hierarchy", {
        params: { category },
      })
      return res.data.options as string[]
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 60,
  })

  // Fetch level 3 categories (based on category + category2)
  const { data: level3Data } = useQuery({
    queryKey: ["categories", "hierarchy", "level3", category, category2],
    queryFn: async () => {
      const res = await axios.get("/api/categories/hierarchy", {
        params: { category, category_2: category2 },
      })
      return res.data.options as string[]
    },
    enabled: !!category && !!category2,
    staleTime: 1000 * 60 * 60,
  })

  return {
    level1Options: level1Data ?? [],
    level2Options: level2Data ?? [],
    level3Options: level3Data ?? [],
  }
}

function CategoryCascadeFilter({
  category,
  category2,
  category3,
  onCategoryChange,
  onCategory2Change,
  onCategory3Change,
  onClear,
}: CategoryCascadeFilterProps) {
  const { level1Options, level2Options, level3Options } = useCategoryOptions(
    category || undefined,
    category2 || undefined,
  )

  const hasActiveFilter = category || category2 || category3
  const activeCount = [category, category2, category3].filter(Boolean).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative flex items-center justify-start gap-2 font-medium">
          <FilterIcon className="h-4 w-4" />
          <span>Categories</span>
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-2xs flex h-4 w-4 shrink-0 items-center justify-center rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[360px]">
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Level 1: Category */}
        <div className="p-2">
          <Label className="text-muted-foreground mb-1 block text-xs">Category</Label>
          <Select value={category || "_all"} onValueChange={(v) => onCategoryChange(v === "_all" ? "" : v)}>
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="_all">All categories</SelectItem>
              <SelectSeparator />
              {level1Options.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 2: Subcategory */}
        <div className="p-2 pt-0">
          <Label className="text-muted-foreground mb-1 block text-xs">Subcategory</Label>
          <Select
            value={category2 || "_all"}
            onValueChange={(v) => onCategory2Change(v === "_all" ? "" : v)}
            disabled={!category}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder={category ? "All subcategories" : "Select category first"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              <SelectItem value="_all">All subcategories</SelectItem>
              {level2Options.length > 0 && <SelectSeparator />}
              {level2Options.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 3: Sub-subcategory */}
        <div className="p-2 pt-0">
          <Label className="text-muted-foreground mb-1 block text-xs">Sub-subcategory</Label>
          <Select
            value={category3 || "_all"}
            onValueChange={(v) => onCategory3Change(v === "_all" ? "" : v)}
            disabled={!category2}
          >
            <SelectTrigger className="h-8 w-full text-sm">
              <SelectValue placeholder={category2 ? "All sub-subcategories" : "Select subcategory first"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              <SelectItem value="_all">All sub-subcategories</SelectItem>
              {level3Options.length > 0 && <SelectSeparator />}
              {level3Options.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} className="text-muted-foreground">
              <CircleOffIcon className="h-4 w-4" />
              Clear all categories
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface PriorityFilterDropdownProps {
  selectedPriorities: Set<number>
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
  fullWidth?: boolean
}

function PriorityFilterDropdown({
  selectedPriorities,
  onPriorityToggle,
  onClearPriority,
  fullWidth,
}: PriorityFilterDropdownProps) {
  const hasSelection = selectedPriorities.size > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("relative justify-start font-medium", fullWidth && "w-full")}>
          <MicroscopeIcon className="h-4 w-4" />
          <span>Priority</span>
          {hasSelection && (
            <span className="bg-primary text-primary-foreground text-2xs rounded-full px-1.5 py-0.5">
              {selectedPriorities.size}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {([0, 1, 2, 3, 4, 5] as PriorityLevel[]).map((level) => {
          const config = PRIORITY_CONFIG[level]
          const isSelected = selectedPriorities.has(level)
          return (
            <DropdownMenuItem
              key={level}
              onClick={(e) => {
                e.preventDefault()
                onPriorityToggle(level)
              }}
              className="cursor-pointer"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded text-xs font-bold",
                  config.color,
                  config.textColor,
                )}
              >
                {level}
              </span>
              <span className="flex-1">{config.label}</span>
              {isSelected && <CheckIcon className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearPriority} className="text-muted-foreground">
              <CircleOffIcon className="h-4 w-4" />
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SortMenuProps {
  sortBy: SortByType
  orderByPriority: boolean
  onlyDiscounted: boolean
  onSortChange: (sort: SortByType) => void
  onTogglePriorityOrder: () => void
  onToggleDiscounted: () => void
}

function SortMenu({
  sortBy,
  orderByPriority,
  onlyDiscounted,
  onSortChange,
  onTogglePriorityOrder,
  onToggleDiscounted,
}: SortMenuProps) {
  const getSortIcon = () => {
    switch (sortBy) {
      case "a-z":
        return <ArrowDownAZIcon className="h-4 w-4" />
      case "z-a":
        return <ArrowUpAZIcon className="h-4 w-4" />
      case "price-low-high":
        return <ArrowUpWideNarrowIcon className="h-4 w-4" />
      case "price-high-low":
        return <ArrowDownWideNarrowIcon className="h-4 w-4" />
      default:
        return <ArrowDownAZIcon className="h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative w-auto justify-start lg:w-[120px]">
          {getSortIcon()}
          <span className="hidden lg:block">Sort by</span>
          {(orderByPriority || onlyDiscounted) && (
            <span className="bg-destructive absolute -top-[3px] -right-[3px] size-[10px] rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSortChange("a-z")}>
          <ArrowDownAZ className="h-4 w-4" /> Name A-Z
          {sortBy === "a-z" && <CheckIcon className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("z-a")}>
          <ArrowUpAZ className="h-4 w-4" /> Name Z-A
          {sortBy === "z-a" && <CheckIcon className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("price-high-low")}>
          <ArrowUpWideNarrowIcon className="h-4 w-4" /> Price: High to Low
          {sortBy === "price-high-low" && <CheckIcon className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("price-low-high")}>
          <ArrowDownWideNarrowIcon className="h-4 w-4" /> Price: Low to High
          {sortBy === "price-low-high" && <CheckIcon className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuItem onClick={onToggleDiscounted}>
          <BadgePercentIcon className="h-4 w-4" /> Only discounted
          <ToggleBadge active={onlyDiscounted} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePriorityOrder}>
          <CrownIcon className="h-4 w-4" /> Order by priority
          <ToggleBadge active={orderByPriority} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ToggleBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto h-auto w-6 rounded text-center text-xs font-medium",
        active ? "bg-emerald-600 text-white" : "bg-destructive text-white",
      )}
    >
      {active ? "On" : "Off"}
    </span>
  )
}

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

function PaginationControls({ currentPage, totalPages, isLoading, onPageChange }: PaginationControlsProps) {
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
        disabled={isLoading || currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

function SortButton({
  label,
  value,
  current,
  onChange,
  icon,
}: {
  label: string
  value: SortByType
  current: SortByType
  onChange: (v: SortByType) => void
  icon: React.ReactNode
}) {
  return (
    <Button
      variant={current === value ? "default" : "outline"}
      className="justify-start"
      onClick={() => onChange(value)}
    >
      {icon}
      {label}
    </Button>
  )
}

function ToggleButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <Button variant="outline" className="w-full justify-between" onClick={onClick}>
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
      <ToggleBadge active={active} />
    </Button>
  )
}

function LoadingGrid({ limit }: { limit: number }) {
  return (
    <div className="flex w-full flex-col gap-3 p-4">
      <Skeleton className="border-border h-10 w-full border" />
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-6 2xl:grid-cols-8">
        {Array.from({ length: limit }).map((_, i) => (
          <StoreProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ query, onClearFilters }: { query: string; onClearFilters: () => void }) {
  const router = useRouter()

  return (
    <SectionWrapper>
      <CircleOffIcon className="h-8 w-8" />
      <div className="flex flex-col items-start justify-start">
        <p>No products found matching your search.</p>
        {query && <p className="text-muted-foreground text-sm">Query: &quot;{query}&quot;</p>}
      </div>
      <div className="mt-2 flex w-full items-center justify-center gap-3">
        <Button variant="outline" onClick={() => router.push("/")}>
          <HomeIcon className="h-4 w-4" />
          Return home
        </Button>
        <Button variant="default" onClick={onClearFilters}>
          <RefreshCcwIcon className="h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </SectionWrapper>
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
    <div className="flex items-center justify-between p-4">
      <div className="text-muted-foreground flex w-full flex-col text-sm">
        <span>
          Showing <span className="text-foreground font-semibold">{showingFrom}</span> to{" "}
          <span className="text-foreground font-semibold">{showingTo}</span> of{" "}
          <span className="text-foreground font-semibold">{totalCount}</span> results
        </span>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={false}
        onPageChange={onPageChange}
      />
    </div>
  )
}
