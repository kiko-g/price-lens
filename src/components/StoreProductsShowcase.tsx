"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { useStoreProducts, SupermarketChain, type StoreProductsQueryParams } from "@/hooks/useStoreProducts"
import { searchTypes, type SearchType, type SortByType } from "@/types/extra"
import { cn, getCenteredArray } from "@/lib/utils"

import { DevBadge } from "@/components/ui/combo/dev-badge"
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BorderBeam } from "@/components/ui/magic/border-beam"

import { StoreProductCard } from "@/components/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/StoreProductCardSkeleton"
import { SectionWrapper } from "@/components/ui/combo/section-wrapper"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "@/components/PriorityBubble"
import { ScrapeUrlDialog } from "@/components/admin/ScrapeUrlDialog"
import { BulkPriorityDialog } from "@/components/admin/BulkPriorityDialog"

import {
  ArrowDownAZ,
  ArrowDownWideNarrowIcon,
  ArrowUpAZ,
  ArrowUpWideNarrowIcon,
  BadgePercentIcon,
  BotIcon,
  CircleOffIcon,
  CrownIcon,
  FilterIcon,
  HandIcon,
  HomeIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react"
import { PrioritySource } from "@/types"

interface StoreProductsShowcaseProps {
  limit?: number
  children?: React.ReactNode
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
      source: searchParams.get("source") ?? "",
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
          (key === "source" && value === "") ||
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

  // Source filter (priority_source)
  if (urlState.source) {
    const sourceValues = urlState.source
      .split(",")
      .map((v) => v.trim())
      .filter((v): v is PrioritySource => v === "ai" || v === "manual")

    if (sourceValues.length > 0) {
      params.source = { values: sourceValues }
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
// Main Component
// ============================================================================

export function StoreProductsShowcase({ limit = 40, children }: StoreProductsShowcaseProps) {
  const router = useRouter()
  const { urlState, updateUrl } = useUrlState()

  // Local input state (for search)
  const [queryInput, setQueryInput] = useState(urlState.query)
  const [isSearching, setIsSearching] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Parse origin, priority, and source from URL
  const selectedOrigins = useMemo(() => parseArrayParam(urlState.origin), [urlState.origin])
  const selectedPriorities = useMemo(() => parseArrayParam(urlState.priority), [urlState.priority])
  const selectedSources = useMemo(() => {
    if (!urlState.source) return [] as PrioritySource[]
    return urlState.source.split(",").filter((v): v is PrioritySource => v === "ai" || v === "manual")
  }, [urlState.source])

  // Build query params from URL state
  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  // Fetch products
  const { data: products, pagination, isLoading, isFetching, isError, refetch } = useStoreProducts(queryParams)

  // Sync local query input when URL changes
  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  // Track searching state
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
    // Scroll to top of grid on page change
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSortChange = (newSort: SortByType) => {
    updateUrl({ sort: newSort, page: 1 })
  }

  const handleSearchTypeChange = (newType: SearchType) => {
    updateUrl({ t: newType })
  }

  const handleTogglePriorityOrder = () => {
    updateUrl({ priority_order: !urlState.orderByPriority, page: 1 })
  }

  const handleToggleDiscounted = () => {
    updateUrl({ discounted: !urlState.onlyDiscounted, page: 1 })
  }

  // Origin multi-select handlers
  const handleOriginToggle = (originId: number) => {
    const isSelected = selectedOrigins.includes(originId)
    const updated = isSelected ? selectedOrigins.filter((v) => v !== originId) : [...selectedOrigins, originId]
    updateUrl({ origin: serializeArray(updated), page: 1 })
  }

  const handleClearOrigins = () => {
    updateUrl({ origin: null, page: 1 })
  }

  // Priority multi-select handlers
  const handlePriorityToggle = (level: number) => {
    const isSelected = selectedPriorities.includes(level)
    const updated = isSelected ? selectedPriorities.filter((v) => v !== level) : [...selectedPriorities, level]
    updateUrl({ priority: serializeArray(updated), page: 1 })
  }

  const handleClearPriority = () => {
    updateUrl({ priority: "", page: 1 })
  }

  // Source multi-select handlers
  const handleSourceToggle = (source: PrioritySource) => {
    const isSelected = selectedSources.includes(source)
    const updated = isSelected ? selectedSources.filter((v) => v !== source) : [...selectedSources, source]
    updateUrl({ source: updated.length > 0 ? updated.join(",") : null, page: 1 })
  }

  const handleClearSources = () => {
    updateUrl({ source: null, page: 1 })
  }

  // Category handlers
  const handleCategoryChange = (category: string) => {
    updateUrl({ cat: category, cat2: "", cat3: "", page: 1 })
  }

  const handleCategory2Change = (category2: string) => {
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

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = pagination?.totalPages ?? 0
  const totalCount = pagination?.totalCount ?? 0
  const currentPage = urlState.page

  const showingFrom = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0
  const showingTo = Math.min(currentPage * limit, totalCount)

  // Show full skeleton grid only on initial load (no products yet)
  // Show overlay when we have products but are fetching new ones
  const showSkeletons = isLoading && products.length === 0
  const showOverlay = isFetching && products.length > 0

  // Build filter params string for bulk priority API (dev only)
  const bulkPriorityFilterParams = useMemo(() => {
    const params = new URLSearchParams()
    if (urlState.query) {
      params.set("q", urlState.query)
      params.set("searchType", urlState.searchType)
    }
    if (urlState.origin) params.set("origin", urlState.origin)
    if (urlState.priority) params.set("priority", urlState.priority)
    if (urlState.source) params.set("source", urlState.source)
    if (urlState.category) params.set("category", urlState.category)
    if (urlState.category2) params.set("category_2", urlState.category2)
    if (urlState.category3) params.set("category_3", urlState.category3)
    if (urlState.onlyDiscounted) params.set("onlyDiscounted", "true")
    return params.toString()
  }, [urlState])

  // Build human-readable filter summary (dev only)
  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (urlState.query) parts.push(`Search: "${urlState.query}"`)
    if (selectedOrigins.length > 0) {
      const names = selectedOrigins.map((id) => {
        if (id === 1) return "Continente"
        if (id === 2) return "Auchan"
        if (id === 3) return "Pingo Doce"
        return `Store ${id}`
      })
      parts.push(`Store: ${names.join(", ")}`)
    }
    if (selectedPriorities.length > 0) parts.push(`Priority: ${selectedPriorities.join(", ")}`)
    if (selectedSources.length > 0) parts.push(`Source: ${selectedSources.join(", ")}`)
    if (urlState.category) parts.push(`Category: ${urlState.category}`)
    if (urlState.category2) parts.push(`Subcategory: ${urlState.category2}`)
    if (urlState.category3) parts.push(`Sub-subcategory: ${urlState.category3}`)
    if (urlState.onlyDiscounted) parts.push("Only discounted")
    return parts.length > 0 ? parts.join(" • ") : "No filters applied (all products)"
  }, [urlState, selectedOrigins, selectedPriorities, selectedSources])

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
    <div className="flex h-full w-full flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden h-full flex-col overflow-y-auto border-r p-4 lg:flex lg:w-80 lg:min-w-80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-5" />
            <h2 className="text-lg font-bold">Products</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="start">
              <DropdownMenuLabel>Tooling</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <ScrapeUrlDialog />
              </DropdownMenuItem>

              {/* Bulk Set Priority (dev only) */}
              {process.env.NODE_ENV === "development" && (
                <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                  <BulkPriorityDialog filterParams={bulkPriorityFilterParams} filterSummary={filterSummary}>
                    <button className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm">
                      <DevBadge />
                      Bulk Set Priority
                    </button>
                  </BulkPriorityDialog>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          Priority affects how often the prices are updated. Favorited products are assigned a priority of 4.
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
              placeholder="Search products..."
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

          {/* Search Button */}
          <Button variant="primary" disabled={isLoading} onClick={handleSearch} className="h-full w-min px-2">
            {isSearching ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Product Count */}
        <div className="mt-2 flex flex-col gap-2">
          {showSkeletons ? (
            <Skeleton className="h-4 w-full rounded-md" />
          ) : (
            <p className="text-muted-foreground text-xs">
              <strong className="text-foreground">{totalCount}</strong> products found
              {urlState.query && ` matching "${urlState.query}"`}
              {showOverlay && (
                <span className="text-muted-foreground ml-2 inline-flex items-center gap-1">
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                </span>
              )}
            </p>
          )}

          {/* Filters Accordion */}
          <Accordion
            type="multiple"
            className="w-full border-t"
            defaultValue={["store-origin", "priority", "categories", "sort", "options"]}
          >
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

            {/* Priority Filter */}
            <AccordionItem value="priority">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Priority
                {selectedPriorities.length > 0 && (
                  <>
                    <span className="text-muted-foreground text-xs">({selectedPriorities.length})</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClearPriority()
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
                  {[0, 1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${level}`}
                        checked={selectedPriorities.includes(level)}
                        onCheckedChange={() => handlePriorityToggle(level)}
                      />
                      <Label
                        htmlFor={`priority-${level}`}
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <PriorityBubble priority={level} size="sm" useDescription />
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Source Filter (Dev Only) */}
            {process.env.NODE_ENV === "development" && (
              <AccordionItem value="source">
                <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-1">
                    Source
                    <DevBadge />
                  </span>
                  {selectedSources.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-xs">({selectedSources.length})</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClearSources()
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
                        id="source-ai"
                        checked={selectedSources.includes("ai")}
                        onCheckedChange={() => handleSourceToggle("ai")}
                      />
                      <Label
                        htmlFor="source-ai"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <BotIcon className="h-4 w-4" />
                        AI
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="source-manual"
                        checked={selectedSources.includes("manual")}
                        onCheckedChange={() => handleSourceToggle("manual")}
                      />
                      <Label
                        htmlFor="source-manual"
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        <HandIcon className="h-4 w-4" />
                        Manual
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Categories Filter */}
            <AccordionItem value="categories">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Categories
                {(urlState.category || urlState.category2 || urlState.category3) && (
                  <>
                    <span className="text-muted-foreground text-xs">
                      ({[urlState.category, urlState.category2, urlState.category3].filter(Boolean).length})
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClearCategories()
                      }}
                      className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                    >
                      Clear
                    </span>
                  </>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <CategoryCascadeFilter
                  category={urlState.category}
                  category2={urlState.category2}
                  category3={urlState.category3}
                  onCategoryChange={handleCategoryChange}
                  onCategory2Change={handleCategory2Change}
                  onCategory3Change={handleCategory3Change}
                />
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
                    label="Name A-Z"
                    value="a-z"
                    current={urlState.sortBy}
                    onChange={handleSortChange}
                    icon={<ArrowDownAZ className="h-4 w-4" />}
                  />
                  <SortOption
                    label="Name Z-A"
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="order-by-priority"
                      checked={urlState.orderByPriority}
                      onCheckedChange={handleTogglePriorityOrder}
                    />
                    <Label
                      htmlFor="order-by-priority"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <CrownIcon className="h-4 w-4" />
                      Order by priority
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
        isLoading={isLoading}
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
        selectedPriorities={selectedPriorities}
        selectedSources={selectedSources}
        onOriginToggle={handleOriginToggle}
        onClearOrigins={handleClearOrigins}
        onPriorityToggle={handlePriorityToggle}
        onClearPriority={handleClearPriority}
        onSourceToggle={handleSourceToggle}
        onClearSources={handleClearSources}
        onCategoryChange={handleCategoryChange}
        onCategory2Change={handleCategory2Change}
        onCategory3Change={handleCategory3Change}
        onClearCategories={handleClearCategories}
        onSortChange={handleSortChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleDiscounted={handleToggleDiscounted}
        onApply={handleSearch}
      />

      {/* Main Content Area */}
      <div className="flex h-full w-full flex-1 flex-col overflow-y-auto p-4">
        {/* Products Grid */}
        {showSkeletons ? (
          <LoadingGrid limit={limit} />
        ) : products.length > 0 ? (
          <>
            {/* Status Bar - Desktop */}
            <div className="text-muted-foreground mb-4 hidden items-center justify-between text-xs lg:flex">
              <span>
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="text-foreground font-semibold">{totalCount}</span> results
              </span>
              <span>
                Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
                <span className="text-foreground font-semibold">{totalPages}</span>
              </span>
            </div>

            {/* Products grid with loading overlay */}
            <div className="relative">
              {/* Loading overlay */}
              {showOverlay && (
                <div className="bg-background/60 absolute inset-0 z-10 flex items-start justify-center pt-24 backdrop-blur-[2px]">
                  <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "grid w-full grid-cols-2 gap-x-3 gap-y-10 transition-opacity duration-200 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
                  showOverlay && "pointer-events-none",
                )}
              >
                {products.map((product, idx) => (
                  <StoreProductCard key={product.id} sp={product} imagePriority={idx < 12} />
                ))}
              </div>
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

            {/* Use children here to render the footer (or content below the products grid) */}
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
  isLoading: boolean
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
    <nav className="sticky top-0 z-50 mx-auto flex w-full flex-col gap-0 border-b bg-white/95 px-4 py-3 backdrop-blur backdrop-filter lg:top-[54px] lg:hidden dark:bg-zinc-950/95">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : (
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          )}
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
        <Button variant="primary" disabled={isSearching} onClick={onSearch} className="px-4">
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
  selectedOrigins: number[]
  selectedPriorities: number[]
  selectedSources: PrioritySource[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
  onSourceToggle: (source: PrioritySource) => void
  onClearSources: () => void
  onCategoryChange: (category: string) => void
  onCategory2Change: (category2: string) => void
  onCategory3Change: (category3: string) => void
  onClearCategories: () => void
  onSortChange: (sort: SortByType) => void
  onTogglePriorityOrder: () => void
  onToggleDiscounted: () => void
  onApply: () => void
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  urlState,
  selectedOrigins,
  selectedPriorities,
  selectedSources,
  onOriginToggle,
  onClearOrigins,
  onPriorityToggle,
  onClearPriority,
  onSourceToggle,
  onClearSources,
  onCategoryChange,
  onCategory2Change,
  onCategory3Change,
  onClearCategories,
  onSortChange,
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
          <div className="mt-2 flex flex-col gap-6 overflow-y-auto border-t px-4 pt-2 pb-24">
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

            {/* Priority Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Priority</Label>
                {selectedPriorities.length > 0 && (
                  <button onClick={onClearPriority} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-priority-${level}`}
                      checked={selectedPriorities.includes(level)}
                      onCheckedChange={() => onPriorityToggle(level)}
                    />
                    <Label
                      htmlFor={`mobile-priority-${level}`}
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <PriorityBubble priority={level} size="sm" useDescription />
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Filter (Dev Only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1 text-base font-semibold">
                    Source
                    <DevBadge />
                  </Label>
                  {selectedSources.length > 0 && (
                    <button onClick={onClearSources} className="text-muted-foreground text-xs hover:underline">
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-source-ai"
                      checked={selectedSources.includes("ai")}
                      onCheckedChange={() => onSourceToggle("ai")}
                    />
                    <Label
                      htmlFor="mobile-source-ai"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <BotIcon className="h-4 w-4" />
                      AI
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-source-manual"
                      checked={selectedSources.includes("manual")}
                      onCheckedChange={() => onSourceToggle("manual")}
                    />
                    <Label
                      htmlFor="mobile-source-manual"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <HandIcon className="h-4 w-4" />
                      Manual
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Categories</Label>
                {(urlState.category || urlState.category2 || urlState.category3) && (
                  <button onClick={onClearCategories} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <CategoryCascadeFilter
                category={urlState.category}
                category2={urlState.category2}
                category3={urlState.category3}
                onCategoryChange={onCategoryChange}
                onCategory2Change={onCategory2Change}
                onCategory3Change={onCategory3Change}
              />
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-order-by-priority"
                    checked={urlState.orderByPriority}
                    onCheckedChange={onTogglePriorityOrder}
                  />
                  <Label
                    htmlFor="mobile-order-by-priority"
                    className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                  >
                    <CrownIcon className="h-4 w-4" />
                    Order by priority
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
// Category Cascade Filter
// ============================================================================

interface CategoryCascadeFilterProps {
  category: string
  category2: string
  category3: string
  onCategoryChange: (category: string) => void
  onCategory2Change: (category2: string) => void
  onCategory3Change: (category3: string) => void
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
}: CategoryCascadeFilterProps) {
  const { level1Options, level2Options, level3Options } = useCategoryOptions(
    category || undefined,
    category2 || undefined,
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Level 1: Category */}
      <div>
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
      <div>
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
      <div>
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
    </div>
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
  value: SortByType
  current: SortByType
  onChange: (v: SortByType) => void
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

function LoadingGrid({ limit }: { limit: number }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <div className="grid w-full grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
    <div className="mt-8 flex items-center justify-between border-t py-4">
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
