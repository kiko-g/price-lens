"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { useUser } from "@/hooks/useUser"
import { useFavoritesFiltered, type FavoritesQueryParams, type FavoritesSortType } from "@/hooks/useFavoritesFiltered"
import { searchTypes, type SearchType } from "@/types/business"
import { cn, getCenteredArray } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
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
import { BorderBeam } from "@/components/ui/magic/border-beam"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/StoreProductCardSkeleton"
import { SectionWrapper } from "@/components/ui/combo/section-wrapper"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"

import {
  ArrowDownAZ,
  ArrowDownWideNarrowIcon,
  ArrowUpAZ,
  ArrowUpWideNarrowIcon,
  BadgePercentIcon,
  CalendarIcon,
  CircleOffIcon,
  FilterIcon,
  HeartIcon,
  Loader2Icon,
  LogInIcon,
  RefreshCcwIcon,
  SearchIcon,
  ClockIcon,
} from "lucide-react"
import { HideFooter } from "@/contexts/FooterContext"
import { Footer } from "@/components/layout/Footer"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"

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
          (key === "discounted" && value === false)

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
    flags: { onlyDiscounted: urlState.onlyDiscounted },
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
// Main Page Component
// ============================================================================

export default function FavoritesPage() {
  const { user, isLoading: isLoadingUser } = useUser()

  if (isLoadingUser) {
    return (
      <main className="lg:h-[calc(100dvh-54px)] lg:overflow-hidden">
        <HideFooter />
        <FavoritesPageSkeleton />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex items-center justify-center lg:h-[calc(100dvh-54px)] lg:overflow-hidden">
        <HideFooter />
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <LogInIcon className="h-8 w-8" />
              </div>
              <CardTitle>Sign in to view your favorites</CardTitle>
              <CardDescription>
                Create an account or sign in to save your favorite products and track their prices over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="lg:h-[calc(100dvh-54px)] lg:overflow-hidden">
      <HideFooter />
      <FavoritesShowcase limit={40}>
        <Footer className="bg-transparent px-0 pt-4 pb-0 sm:px-0 sm:pt-4 sm:pb-0 lg:px-0 lg:pt-4 lg:pb-0 dark:bg-transparent" />
      </FavoritesShowcase>
    </main>
  )
}

// ============================================================================
// Favorites Showcase Component
// ============================================================================

function FavoritesShowcase({ limit = 24, children }: { limit?: number; children?: React.ReactNode }) {
  const router = useRouter()
  const { urlState, updateUrl } = useUrlState()

  const [queryInput, setQueryInput] = useState(urlState.query)
  const [isSearching, setIsSearching] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const selectedOrigins = useMemo(() => parseArrayParam(urlState.origin), [urlState.origin])

  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  const { data: favorites, pagination, isLoading, isFetching, isError, refetch } = useFavoritesFiltered(queryParams)

  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  useEffect(() => {
    if (isFetching) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [isFetching])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearch = () => {
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

  const handleToggleDiscounted = () => {
    updateUrl({ discounted: !urlState.onlyDiscounted, page: 1 })
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

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = pagination?.totalPages ?? 0
  const totalCount = pagination?.totalCount ?? 0
  const currentPage = urlState.page

  const showingFrom = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0
  const showingTo = Math.min(currentPage * limit, totalCount)

  const showSkeletons = isLoading && favorites.length === 0
  const showOverlay = isFetching && favorites.length > 0

  if (isError) {
    return (
      <SectionWrapper>
        <CircleOffIcon className="h-6 w-6" />
        <p>Error fetching favorites. Please try again.</p>
        <Button variant="default" onClick={() => refetch()}>
          <span>Try again</span>
          <RefreshCcwIcon />
        </Button>
      </SectionWrapper>
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

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full">
            {isSearching ? (
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

          <Button variant="primary" disabled={isLoading} onClick={handleSearch} className="h-full w-min px-2">
            {isSearching ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Favorites Count */}
        <div className="mt-2 flex flex-col gap-2">
          {showSkeletons ? (
            <Skeleton className="h-4 w-full rounded-md" />
          ) : (
            <p className="text-muted-foreground text-xs">
              <strong className="text-foreground">{totalCount}</strong> favorites
              {urlState.query && ` matching "${urlState.query}"`}
              {showOverlay && (
                <span className="text-muted-foreground ml-2 inline-flex items-center gap-1">
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                </span>
              )}
            </p>
          )}

          {/* Filters Accordion */}
          <Accordion type="multiple" className="w-full border-t" defaultValue={["store-origin", "sort", "options"]}>
            {/* Store Origin Filter */}
            <AccordionItem value="store-origin">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Store Origin
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
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Sort By
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-1">
                  <SortOption
                    label="Recently Added"
                    value="recently-added"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<CalendarIcon className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Oldest First"
                    value="oldest-first"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ClockIcon className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Name (A to Z)"
                    value="a-z"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ArrowDownAZ className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Name (Z to A)"
                    value="z-a"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ArrowUpAZ className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Price: High to Low"
                    value="price-high-low"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ArrowUpWideNarrowIcon className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Price: Low to High"
                    value="price-low-high"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ArrowDownWideNarrowIcon className="h-4 w-4" />}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Filter Options */}
            <AccordionItem value="options">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Options
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-discounted"
                      checked={urlState.onlyDiscounted}
                      onCheckedChange={handleToggleDiscounted}
                    />
                    <Label
                      htmlFor="only-discounted"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <BadgePercentIcon className="h-4 w-4" />
                      Only discounted
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNav
        urlState={urlState}
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        onSearch={handleSearch}
        onSearchTypeChange={handleSearchTypeChange}
        isSearching={isSearching}
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
        selectedOrigins={selectedOrigins}
        onOriginToggle={handleOriginToggle}
        onClearOrigins={handleClearOrigins}
        onSortChange={handleSortChange}
        onToggleDiscounted={handleToggleDiscounted}
        onApply={handleSearch}
      />

      {/* Main Content Area */}
      <div className="flex w-full flex-1 flex-col p-4 lg:h-full lg:overflow-y-auto">
        {showSkeletons ? (
          <LoadingGrid limit={limit} />
        ) : favorites.length > 0 ? (
          <>
            {/* Status Bar - Desktop */}
            <div className="text-muted-foreground mb-4 hidden items-center justify-between text-xs lg:flex">
              <span>
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="text-foreground font-semibold">{totalCount}</span> favorites
              </span>
              <span>
                Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
                <span className="text-foreground font-semibold">{totalPages}</span>
              </span>
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

interface MobileNavProps {
  urlState: ReturnType<typeof useUrlState>["urlState"]
  queryInput: string
  setQueryInput: (value: string) => void
  onSearch: () => void
  onSearchTypeChange: (type: SearchType) => void
  isSearching: boolean
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
  isSearching,
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
          {isSearching ? (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : (
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          )}
          <Input
            type="text"
            placeholder="Search favorites..."
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
        <Button variant="primary" disabled={isSearching} onClick={onSearch} className="px-4">
          Search
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="text-muted-foreground mt-2 flex w-full items-center justify-between text-xs leading-none">
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
  selectedOrigins: number[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onSortChange: (sort: FavoritesSortType) => void
  onToggleDiscounted: () => void
  onApply: () => void
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  urlState,
  selectedOrigins,
  onOriginToggle,
  onClearOrigins,
  onSortChange,
  onToggleDiscounted,
  onApply,
}: MobileFiltersDrawerProps) {
  return (
    <>
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
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="text-left">Filters & Sort</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto border-t px-4 pt-4 pb-24">
            {/* Store Origin Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Store Origin</Label>
                {selectedOrigins.length > 0 && (
                  <button onClick={onClearOrigins} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-origin-continente"
                    checked={selectedOrigins.includes(1)}
                    onCheckedChange={() => onOriginToggle(1)}
                  />
                  <Label
                    htmlFor="mobile-origin-continente"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <ContinenteSvg className="h-4 min-h-4 w-auto" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-origin-auchan"
                    checked={selectedOrigins.includes(2)}
                    onCheckedChange={() => onOriginToggle(2)}
                  />
                  <Label
                    htmlFor="mobile-origin-auchan"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <AuchanSvg className="h-4 min-h-4 w-auto" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-origin-pingo-doce"
                    checked={selectedOrigins.includes(3)}
                    onCheckedChange={() => onOriginToggle(3)}
                  />
                  <Label
                    htmlFor="mobile-origin-pingo-doce"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <PingoDoceSvg className="h-4 min-h-4 w-auto" />
                  </Label>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sort By</Label>
              <div className="grid grid-cols-1 gap-2">
                <SortButton
                  label="Recently Added"
                  value="recently-added"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<CalendarIcon className="h-4 w-4" />}
                />
                <SortButton
                  label="Oldest First"
                  value="oldest-first"
                  current={urlState.sortBy}
                  onChange={onSortChange}
                  icon={<ClockIcon className="h-4 w-4" />}
                />
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
              <Label className="text-base font-semibold">Options</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-only-discounted"
                    checked={urlState.onlyDiscounted}
                    onCheckedChange={onToggleDiscounted}
                  />
                  <Label
                    htmlFor="mobile-only-discounted"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <BadgePercentIcon className="h-4 w-4" />
                    Only discounted
                  </Label>
                </div>
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

function SortOption({
  label,
  value,
  current,
  onChange,
  icon,
}: {
  label: string
  value: FavoritesSortType
  current: FavoritesSortType
  onChange: (v: FavoritesSortType) => void
  icon: React.ReactNode
}) {
  const isSelected = current === value
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        isSelected ? "bg-foreground text-background" : "hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
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
  value: FavoritesSortType
  current: FavoritesSortType
  onChange: (v: FavoritesSortType) => void
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
    <SectionWrapper>
      <HeartIcon className="text-muted-foreground h-12 w-12" />
      <div className="flex flex-col items-center justify-center text-center">
        {query ? (
          <>
            <p className="text-lg font-medium">No favorites match your search</p>
            <p className="text-muted-foreground text-sm">Query: &quot;{query}&quot;</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">No favorites yet</p>
            <p className="text-muted-foreground text-sm">Start adding products to your favorites to see them here</p>
          </>
        )}
      </div>
      <div className="mt-4 flex w-full items-center justify-center gap-3">
        {query ? (
          <>
            <Button variant="outline" onClick={onClearFilters}>
              <RefreshCcwIcon className="h-4 w-4" />
              Clear filters
            </Button>
          </>
        ) : (
          <Button onClick={() => router.push("/products")}>
            <SearchIcon className="h-4 w-4" />
            Find Products
          </Button>
        )}
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

function FavoritesPageSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground text-sm">Loading favorites...</span>
      </div>
    </div>
  )
}
