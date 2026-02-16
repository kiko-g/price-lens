"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { PrioritySource, CanonicalCategory } from "@/types"

import { useStoreProducts, SupermarketChain, type StoreProductsQueryParams } from "@/hooks/useStoreProducts"
import { useTrackedDebouncedCallback } from "@/hooks/useTrackedDebouncedCallback"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { searchTypes, type SearchType, type SortByType } from "@/types/business"
import { PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import { cn, getCenteredArray, serializeArray } from "@/lib/utils"
import { SORT_OPTIONS_GROUPS } from "@/lib/business/filters"
import { buildPageTitle } from "@/lib/business/page-title"

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

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/StoreProductCardSkeleton"
import { SectionWrapper } from "@/components/ui/combo/section-wrapper"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { ScrapeUrlDialog } from "@/components/admin/ScrapeUrlDialog"
import { BulkPriorityDialog } from "@/components/admin/BulkPriorityDialog"
import { TrackingInformationDialog } from "@/components/admin/TrackingInformationDialog"

import {
  BadgePercentIcon,
  BotIcon,
  CircleCheckIcon,
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
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

const FILTER_DEBOUNCE_MS = 750 // Debounce delay for filter changes
const USE_SORT_GROUPS = false

function DebounceProgressBar({ durationMs }: { durationMs: number }) {
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="bg-primary/20 hidden h-1 w-12 overflow-hidden rounded-full md:block">
      <div
        className="bg-primary h-full rounded-full transition-[width] ease-linear"
        style={{ width: filled ? "100%" : "0%", transitionDuration: `${durationMs}ms` }}
      />
    </div>
  )
}

/**
 * Single source of truth for URL filter parameters.
 * - `key`: The URL search param name
 * - `default`: The default value (omitted from URL when matched)
 */
const FILTER_CONFIG = {
  page: { key: "page", default: 1 },
  sortBy: { key: "sort", default: "updated-newest" },
  origin: { key: "origin", default: "" },
  searchType: { key: "t", default: "any" },
  query: { key: "q", default: "" },
  orderByPriority: { key: "priority_order", default: true },
  onlyAvailable: { key: "available", default: true },
  onlyDiscounted: { key: "discounted", default: false },
  priority: { key: "priority", default: "" },
  source: { key: "source", default: "" },
  category: { key: "category", default: "" },
} as const

/**
 * Converts a category name to a URL-friendly slug
 * e.g., "Vinhos Tintos" -> "vinhos-tintos"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

/**
 * Creates an ID-slug format for URL (e.g., "72-vinhos-tintos")
 */
function toCategorySlug(id: number, name: string): string {
  return `${id}-${toSlug(name)}`
}

/**
 * Parses the category ID from an ID-slug format (e.g., "72-vinhos-tintos" -> 72)
 */
function parseCategoryId(slug: string): number | null {
  if (!slug) return null
  const match = slug.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

// Build a reverse lookup: URL key -> default value
const URL_KEY_DEFAULTS = Object.fromEntries(
  Object.values(FILTER_CONFIG).map(({ key, default: def }) => [key, def]),
) as Record<string, string | number | boolean>

function useUrlState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlState = useMemo(
    () => ({
      page: parseInt(searchParams.get(FILTER_CONFIG.page.key) ?? String(FILTER_CONFIG.page.default), 10),
      sortBy: (searchParams.get(FILTER_CONFIG.sortBy.key) ?? FILTER_CONFIG.sortBy.default) as SortByType,
      origin: searchParams.get(FILTER_CONFIG.origin.key) ?? FILTER_CONFIG.origin.default,
      searchType: (searchParams.get(FILTER_CONFIG.searchType.key) ?? FILTER_CONFIG.searchType.default) as SearchType,
      query: searchParams.get(FILTER_CONFIG.query.key) ?? FILTER_CONFIG.query.default,
      orderByPriority: searchParams.get(FILTER_CONFIG.orderByPriority.key) !== "false",
      onlyAvailable: searchParams.get(FILTER_CONFIG.onlyAvailable.key) !== "false",
      onlyDiscounted: searchParams.get(FILTER_CONFIG.onlyDiscounted.key) === "true",
      priority: searchParams.get(FILTER_CONFIG.priority.key) ?? FILTER_CONFIG.priority.default,
      source: searchParams.get(FILTER_CONFIG.source.key) ?? FILTER_CONFIG.source.default,
      category: searchParams.get(FILTER_CONFIG.category.key) ?? FILTER_CONFIG.category.default,
    }),
    [searchParams],
  )

  const updateUrl = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        // Remove params when value is null/undefined or matches its default
        const defaultValue = URL_KEY_DEFAULTS[key]
        const shouldRemove = value === undefined || value === null || value === defaultValue

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

  const pageTitle = useMemo(
    () =>
      buildPageTitle({
        query: urlState.query,
        sortBy: urlState.sortBy,
        origins: parseArrayParam(urlState.origin),
        onlyDiscounted: urlState.onlyDiscounted,
      }),
    [urlState.query, urlState.sortBy, urlState.origin, urlState.onlyDiscounted],
  )

  return { urlState, updateUrl, pageTitle }
}

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
      onlyAvailable: urlState.onlyAvailable,
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

  // Canonical category filter (parse ID from slug format: "72-vinhos-tintos")
  if (urlState.category) {
    const categoryId = parseCategoryId(urlState.category)
    if (categoryId && categoryId > 0) {
      params.canonicalCategory = { categoryId }
    }
  }

  return params
}

function parseArrayParam(param: string | null): number[] {
  if (!param) return []
  return param
    .split(",")
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v))
}

// ============================================================================
// Main Component
// ============================================================================
interface StoreProductsShowcaseProps {
  limit?: number
  children?: React.ReactNode
}

export function StoreProductsShowcase({ limit = 20, children }: StoreProductsShowcaseProps) {
  const router = useRouter()
  const { urlState, updateUrl, pageTitle } = useUrlState()

  // Desktop detection (lg breakpoint = 1024px) - debounce only applies on desktop
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // Local input state (for search)
  const [queryInput, setQueryInput] = useState(urlState.query)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Local filter state (updates immediately, syncs to URL with debounce)
  const [localFilters, setLocalFilters] = useState({
    sortBy: urlState.sortBy,
    origin: urlState.origin,
    searchType: urlState.searchType,
    orderByPriority: urlState.orderByPriority,
    onlyAvailable: urlState.onlyAvailable,
    onlyDiscounted: urlState.onlyDiscounted,
    priority: urlState.priority,
    source: urlState.source,
    category: urlState.category,
  })

  // Debounced URL sync for filter changes
  const {
    trigger: debouncedUpdateUrl,
    animKey: debounceAnimKey,
    completed: debounceCompleted,
    setCompleted: setDebounceCompleted,
  } = useTrackedDebouncedCallback(updateUrl, FILTER_DEBOUNCE_MS)

  // Check if there are pending filter changes (local differs from URL)
  const hasPendingChanges = useMemo(() => {
    return (
      queryInput !== urlState.query ||
      localFilters.sortBy !== urlState.sortBy ||
      localFilters.origin !== urlState.origin ||
      localFilters.searchType !== urlState.searchType ||
      localFilters.orderByPriority !== urlState.orderByPriority ||
      localFilters.onlyAvailable !== urlState.onlyAvailable ||
      localFilters.onlyDiscounted !== urlState.onlyDiscounted ||
      localFilters.priority !== urlState.priority ||
      localFilters.source !== urlState.source ||
      localFilters.category !== urlState.category
    )
  }, [queryInput, localFilters, urlState])

  // Parse origin, priority, and source from local filters (for UI)
  const selectedOrigins = useMemo(() => parseArrayParam(localFilters.origin), [localFilters.origin])
  const selectedPriorities = useMemo(() => parseArrayParam(localFilters.priority), [localFilters.priority])
  const selectedSources = useMemo(() => {
    if (!localFilters.source) return [] as PrioritySource[]
    return localFilters.source.split(",").filter((v): v is PrioritySource => v === "ai" || v === "manual")
  }, [localFilters.source])

  // Build query params from URL state
  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  // Fetch products
  const { data: products, pagination, isLoading, isFetching, isError, refetch } = useStoreProducts(queryParams)

  // Sync local query input when URL changes
  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  useEffect(() => {
    if (!isFetching && !hasPendingChanges) setDebounceCompleted(false)
  }, [isFetching, hasPendingChanges, setDebounceCompleted])
  const isSearching = isFetching || debounceCompleted

  // Update document title based on active filters
  useEffect(() => {
    document.title = `Price Lens | ${pageTitle}`
  }, [pageTitle])

  // Sync URL state back to local state (e.g., browser back/forward navigation)
  useEffect(() => {
    setLocalFilters({
      sortBy: urlState.sortBy,
      origin: urlState.origin,
      searchType: urlState.searchType,
      orderByPriority: urlState.orderByPriority,
      onlyAvailable: urlState.onlyAvailable,
      onlyDiscounted: urlState.onlyDiscounted,
      priority: urlState.priority,
      source: urlState.source,
      category: urlState.category,
    })
  }, [urlState])

  // ============================================================================
  // Handlers
  // ============================================================================

  // Explicit action: flush debounce and update URL immediately
  const handleSearch = () => {
    setMobileFiltersOpen(false)
    debouncedUpdateUrl.cancel()
    updateUrl({
      q: queryInput,
      t: localFilters.searchType,
      sort: localFilters.sortBy,
      origin: localFilters.origin || null,
      priority: localFilters.priority || null,
      source: localFilters.source || null,
      category: localFilters.category || null,
      priority_order: localFilters.orderByPriority,
      available: localFilters.onlyAvailable,
      discounted: localFilters.onlyDiscounted,
      page: 1,
    })
  }

  // Explicit action: flush debounce and update URL immediately
  const handlePageChange = (newPage: number) => {
    debouncedUpdateUrl.cancel()
    updateUrl({
      q: queryInput || null,
      t: localFilters.searchType,
      sort: localFilters.sortBy,
      origin: localFilters.origin || null,
      priority: localFilters.priority || null,
      source: localFilters.source || null,
      category: localFilters.category || null,
      priority_order: localFilters.orderByPriority,
      available: localFilters.onlyAvailable,
      discounted: localFilters.onlyDiscounted,
      page: newPage,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Filter change: update local state (desktop: debounce URL sync, mobile: no auto-sync)
  const handleSortChange = (newSort: SortByType) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: newSort }))
    if (isDesktop) debouncedUpdateUrl({ sort: newSort, page: 1 })
  }

  // Filter change: update local state (desktop: debounce URL sync, mobile: no auto-sync)
  const handleSearchTypeChange = (newType: SearchType) => {
    setLocalFilters((prev) => ({ ...prev, searchType: newType }))
    if (isDesktop) debouncedUpdateUrl({ t: newType })
  }

  // Filter change: update local state (desktop: debounce URL sync, mobile: no auto-sync)
  const handleTogglePriorityOrder = () => {
    const newValue = !localFilters.orderByPriority
    setLocalFilters((prev) => ({ ...prev, orderByPriority: newValue }))
    if (isDesktop) debouncedUpdateUrl({ priority_order: newValue, page: 1 })
  }

  // Filter change: update local state (desktop: debounce URL sync, mobile: no auto-sync)
  const handleToggleDiscounted = () => {
    const newValue = !localFilters.onlyDiscounted
    setLocalFilters((prev) => ({ ...prev, onlyDiscounted: newValue }))
    if (isDesktop) debouncedUpdateUrl({ discounted: newValue, page: 1 })
  }

  // Filter change: update local state (desktop: debounce URL sync, mobile: no auto-sync)
  const handleToggleAvailable = () => {
    const newValue = !localFilters.onlyAvailable
    setLocalFilters((prev) => ({ ...prev, onlyAvailable: newValue }))
    if (isDesktop) debouncedUpdateUrl({ available: newValue, page: 1 })
  }

  // Origin multi-select handlers (desktop: debounce URL sync, mobile: no auto-sync)
  const handleOriginToggle = (originId: number) => {
    const isSelected = selectedOrigins.includes(originId)
    const updated = isSelected ? selectedOrigins.filter((v) => v !== originId) : [...selectedOrigins, originId]
    const serialized = serializeArray(updated) ?? ""
    setLocalFilters((prev) => ({ ...prev, origin: serialized }))
    if (isDesktop) debouncedUpdateUrl({ origin: serialized || null, page: 1 })
  }

  const handleClearOrigins = () => {
    setLocalFilters((prev) => ({ ...prev, origin: "" }))
    if (isDesktop) debouncedUpdateUrl({ origin: null, page: 1 })
  }

  // Priority multi-select handlers (desktop: debounce URL sync, mobile: no auto-sync)
  const handlePriorityToggle = (level: number) => {
    const isSelected = selectedPriorities.includes(level)
    const updated = isSelected ? selectedPriorities.filter((v) => v !== level) : [...selectedPriorities, level]
    const serialized = serializeArray(updated) ?? ""
    setLocalFilters((prev) => ({ ...prev, priority: serialized }))
    if (isDesktop) debouncedUpdateUrl({ priority: serialized || null, page: 1 })
  }

  const handleClearPriority = () => {
    setLocalFilters((prev) => ({ ...prev, priority: "" }))
    if (isDesktop) debouncedUpdateUrl({ priority: null, page: 1 })
  }

  // Source multi-select handlers (desktop: debounce URL sync, mobile: no auto-sync)
  const handleSourceToggle = (source: PrioritySource) => {
    const isSelected = selectedSources.includes(source)
    const updated = isSelected ? selectedSources.filter((v) => v !== source) : [...selectedSources, source]
    const serialized = updated.length > 0 ? updated.join(",") : ""
    setLocalFilters((prev) => ({ ...prev, source: serialized }))
    if (isDesktop) debouncedUpdateUrl({ source: serialized || null, page: 1 })
  }

  const handleClearSources = () => {
    setLocalFilters((prev) => ({ ...prev, source: "" }))
    if (isDesktop) debouncedUpdateUrl({ source: null, page: 1 })
  }

  // Canonical category handler (desktop: debounce URL sync, mobile: no auto-sync)
  // categorySlug is in ID-slug format (e.g., "72-vinhos-tintos")
  const handleCategoryChange = (categorySlug: string) => {
    setLocalFilters((prev) => ({ ...prev, category: categorySlug }))
    if (isDesktop) debouncedUpdateUrl({ category: categorySlug || null, page: 1 })
  }

  const handleClearCategory = () => {
    setLocalFilters((prev) => ({ ...prev, category: "" }))
    if (isDesktop) debouncedUpdateUrl({ category: null, page: 1 })
  }

  // Explicit action: flush debounce and clear everything
  const handleClearFilters = () => {
    debouncedUpdateUrl.cancel()
    setQueryInput("")
    setLocalFilters({
      sortBy: FILTER_CONFIG.sortBy.default as SortByType,
      origin: FILTER_CONFIG.origin.default,
      searchType: FILTER_CONFIG.searchType.default as SearchType,
      orderByPriority: FILTER_CONFIG.orderByPriority.default,
      onlyAvailable: FILTER_CONFIG.onlyAvailable.default,
      onlyDiscounted: FILTER_CONFIG.onlyDiscounted.default,
      priority: FILTER_CONFIG.priority.default,
      source: FILTER_CONFIG.source.default,
      category: FILTER_CONFIG.category.default,
    })
    router.push(window.location.pathname)
  }

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = pagination?.totalPages ?? null
  const totalCount = pagination?.totalCount ?? null
  const hasNextPage = pagination?.hasNextPage ?? false
  const currentPage = urlState.page

  const hasResults = products.length > 0
  const showingFrom = hasResults ? (currentPage - 1) * limit + 1 : 0
  const showingTo =
    totalCount != null ? Math.min(currentPage * limit, totalCount) : (currentPage - 1) * limit + products.length

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
    // Parse canonical category ID from slug for API
    const catId = parseCategoryId(urlState.category)
    if (catId) params.set("canonicalCat", String(catId))
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
    <div className="flex w-full flex-col lg:h-full lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden h-full flex-1 flex-col overflow-y-auto border-r p-4 lg:flex lg:w-80 lg:max-w-80 lg:min-w-80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-5" />
            <h2 className="text-lg font-bold">Products</h2>
            {isSearching ? (
              <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
            ) : hasPendingChanges ? (
              <DebounceProgressBar key={debounceAnimKey} durationMs={FILTER_DEBOUNCE_MS} />
            ) : null}
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
                    <button className="flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-sm">
                      Bulk Set Priority
                      <DevBadge />
                    </button>
                  </BulkPriorityDialog>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TrackingInformationDialog>
          <button className="text-muted-foreground mb-4 text-left text-sm hover:opacity-80">
            <InfoIcon className="mb-px inline-block size-3.5" /> Procuts have priority levels from 0 to 5. When
            favorited, products are assigned 5
          </button>
        </TrackingInformationDialog>

        {/* Search Input (debounced, no button on desktop) */}
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search products..."
            className="pr-16 text-base md:text-sm"
            value={queryInput}
            onChange={(e) => {
              setQueryInput(e.target.value)
              debouncedUpdateUrl({ q: e.target.value || null, page: 1 })
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Select value={localFilters.searchType} onValueChange={(v) => handleSearchTypeChange(v as SearchType)}>
            <SelectTrigger className="text-muted-foreground hover:bg-primary hover:text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground bg-primary/10 dark:bg-primary/20 absolute top-1/2 right-2 flex h-4 w-auto -translate-y-1/2 items-center justify-center border-0 py-2 pr-0 pl-1 text-xs shadow-none transition">
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

        {/* Product Count */}
        <div className="mt-2 flex flex-col gap-2">
          {showSkeletons ? (
            <Skeleton className="h-4 w-full rounded-md" />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs">
                {totalCount != null ? (
                  <>
                    <strong className="text-foreground">{totalCount}</strong> products found
                  </>
                ) : showingFrom === 0 && showingTo === 0 ? (
                  <>No products found {urlState.query && `matching "${urlState.query}"`}</>
                ) : (
                  <>
                    Showing{" "}
                    <strong className="text-foreground">
                      {showingFrom}-{showingTo}
                    </strong>{" "}
                    products
                  </>
                )}
                {urlState.query && ` matching "${urlState.query}"`}
              </p>
            </div>
          )}

          {/* Filters Accordion */}
          <Accordion
            type="multiple"
            className="w-full border-t"
            defaultValue={["sort", "options", "categories", "store-origin"]}
          >
            {/* Sort Options */}
            <AccordionItem value="sort">
              <AccordionTrigger className="cursor-pointer justify-start gap-2 py-2 text-sm font-medium hover:no-underline">
                <span className="flex flex-1 items-center gap-1">
                  <span>Sort By</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-px pb-3">
                <Select value={localFilters.sortBy} onValueChange={(v) => handleSortChange(v as SortByType)}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue className="flex items-center gap-2 text-sm" />
                  </SelectTrigger>
                  <SelectContent>
                    {USE_SORT_GROUPS
                      ? SORT_OPTIONS_GROUPS.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))
                      : SORT_OPTIONS_GROUPS.flatMap((group) => group.options).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            {/* Checkbox Filter Options */}
            <AccordionItem value="options">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Options
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="order-by-priority"
                      checked={localFilters.orderByPriority}
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-available"
                      checked={localFilters.onlyAvailable}
                      onCheckedChange={handleToggleAvailable}
                    />
                    <Label
                      htmlFor="only-available"
                      className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                    >
                      <CircleCheckIcon className="h-4 w-4" />
                      <span>Only available</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-discounted"
                      checked={localFilters.onlyDiscounted}
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

            {/* Categories Filter */}
            <AccordionItem value="categories">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Categories
                {localFilters.category && (
                  <>
                    <span className="text-muted-foreground text-xs">(1)</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClearCategory()
                      }}
                      className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                    >
                      Clear
                    </span>
                  </>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <CanonicalCategoryCascade
                  selectedCategorySlug={localFilters.category}
                  onCategoryChange={handleCategoryChange}
                />
              </AccordionContent>
            </AccordionItem>

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
                  {[
                    {
                      id: 1,
                      name: "Continente",
                      logo: <ContinenteSvg className="h-4 min-h-4 w-auto" />,
                    },
                    {
                      id: 2,
                      name: "Auchan",
                      logo: <AuchanSvg className="h-4 min-h-4 w-auto" />,
                    },
                    {
                      id: 3,
                      name: "Pingo Doce",
                      logo: <PingoDoceSvg className="h-4 min-h-4 w-auto" />,
                    },
                  ].map((origin) => (
                    <div key={origin.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`origin-${origin.id}`}
                        checked={selectedOrigins.includes(origin.id)}
                        onCheckedChange={() => handleOriginToggle(origin.id)}
                      />
                      <Label
                        htmlFor={`origin-${origin.id}`}
                        className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                      >
                        {origin.logo}
                      </Label>
                    </div>
                  ))}
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
                  {PRODUCT_PRIORITY_LEVELS.filter((level) => level !== 0)
                    .sort((a, b) => (b ?? 0) - (a ?? 0))
                    .map((level) => (
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
                          <PriorityBubble priority={level} size="sm" useDescription usePeriod />
                        </Label>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dev Filters */}
            {process.env.NODE_ENV === "development" && (
              <AccordionItem value="source">
                <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                  <span className="flex flex-1 items-center gap-1">
                    Insiders
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
                        Priority Source AI
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
                        Priority Source Manual
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNav
        localFilters={localFilters}
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
        hasNextPage={hasNextPage}
      />

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        localFilters={localFilters}
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
        onClearCategory={handleClearCategory}
        onSortChange={handleSortChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleDiscounted={handleToggleDiscounted}
        onApply={handleSearch}
      />

      {/* Main Content Area */}
      <div className="flex w-full flex-1 flex-col p-4 lg:h-full lg:overflow-y-auto">
        {/* Products Grid */}
        {showSkeletons ? (
          <LoadingGrid limit={limit} />
        ) : products.length > 0 ? (
          <>
            {/* Status Bar - Desktop */}
            <div className="text-muted-foreground mb-4 hidden w-full items-center justify-between text-sm lg:flex">
              <span>
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {showingFrom}-{showingTo}
                </span>
                {totalCount != null && (
                  <>
                    {" "}
                    of <span className="text-foreground font-semibold">{totalCount}</span>
                  </>
                )}{" "}
                results
              </span>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                className=""
              />
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

              <ProductGridWrapper
                className={cn("w-full transition-opacity duration-200", showOverlay && "pointer-events-none")}
              >
                {products.map((product, idx) => (
                  <StoreProductCard key={product.id} sp={product} imagePriority={idx < 15} />
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
              hasNextPage={hasNextPage}
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
  localFilters: {
    searchType: SearchType
    sortBy: SortByType
    origin: string
    orderByPriority: boolean
    onlyAvailable: boolean
    onlyDiscounted: boolean
    priority: string
    source: string
    category: string
  }
  queryInput: string
  setQueryInput: (value: string) => void
  onSearch: () => void
  onSearchTypeChange: (type: SearchType) => void
  isLoading: boolean
  isSearching: boolean
  showingFrom: number
  showingTo: number
  totalCount: number | null
  currentPage: number
  totalPages: number | null
  hasNextPage: boolean
}

function MobileNav({
  localFilters,
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
    <nav className="sticky top-(--header-height) z-50 mx-auto flex w-full flex-col gap-0 border-b bg-white/95 px-4 py-3 backdrop-blur backdrop-filter lg:hidden dark:bg-zinc-950/95">
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : (
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          )}
          <Input
            type="text"
            placeholder="Search products..."
            className="pr-16 pl-8 text-base"
            value={queryInput}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <Select value={localFilters.searchType} onValueChange={(v) => onSearchTypeChange(v as SearchType)}>
            <SelectTrigger className="text-muted-foreground bg-muted hover:bg-primary hover:text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground absolute top-1/2 right-2 flex h-4 w-auto -translate-y-1/2 items-center justify-center border-0 py-2 pr-0 pl-1 text-xs shadow-none transition">
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
      {showingFrom > 0 && (
        <div className="text-muted-foreground mt-2 flex w-full items-center justify-between text-xs leading-none">
          <span>
            Showing{" "}
            <span className="text-foreground font-semibold">
              {showingFrom}-{showingTo}
            </span>
            {totalCount != null && (
              <>
                {" "}
                of <span className="text-foreground font-semibold">{totalCount}</span>
              </>
            )}
          </span>
          <span>
            Page <span className="text-foreground font-semibold">{currentPage}</span>
            {totalPages != null && (
              <>
                {" "}
                of <span className="text-foreground font-semibold">{totalPages}</span>
              </>
            )}
          </span>
        </div>
      )}
    </nav>
  )
}

interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  localFilters: {
    searchType: SearchType
    sortBy: SortByType
    origin: string
    orderByPriority: boolean
    onlyAvailable: boolean
    onlyDiscounted: boolean
    priority: string
    source: string
    category: string
  }
  selectedOrigins: number[]
  selectedPriorities: number[]
  selectedSources: PrioritySource[]
  onOriginToggle: (origin: number) => void
  onClearOrigins: () => void
  onPriorityToggle: (level: number) => void
  onClearPriority: () => void
  onSourceToggle: (source: PrioritySource) => void
  onClearSources: () => void
  onCategoryChange: (categorySlug: string) => void
  onClearCategory: () => void
  onSortChange: (sort: SortByType) => void
  onTogglePriorityOrder: () => void
  onToggleDiscounted: () => void
  onApply: () => void
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  localFilters,
  selectedOrigins,
  selectedPriorities,
  onOriginToggle,
  onClearOrigins,
  onPriorityToggle,
  onClearPriority,
  onCategoryChange,
  onClearCategory,
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
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="text-left">Filters & Sort</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto border-t px-4 pt-4 pb-24">
            {/* Categories Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Categories</Label>
                {localFilters.category && (
                  <button onClick={onClearCategory} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <CanonicalCategoryCascade
                selectedCategorySlug={localFilters.category}
                onCategoryChange={onCategoryChange}
              />
            </div>

            {/* Sort Options */}
            <div>
              <Label className="text-base font-semibold">Sort By</Label>
              <Select value={localFilters.sortBy} onValueChange={(v) => onSortChange(v as SortByType)}>
                <SelectTrigger className="mt-1 h-8 w-full">
                  <SelectValue className="flex items-center gap-2 text-sm" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS_GROUPS.flatMap((group) => group.options).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store Origin Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Store Origin</Label>
                {selectedOrigins.length > 0 && (
                  <button onClick={onClearOrigins} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-2">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Priority</Label>
                {selectedPriorities.length > 0 && (
                  <button onClick={onClearPriority} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {PRODUCT_PRIORITY_LEVELS.map((level) => (
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

            {/* Filter Options */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Options</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobile-only-discounted"
                    checked={localFilters.onlyDiscounted}
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
                    checked={localFilters.orderByPriority}
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
// Canonical Category Cascade Filter
// ============================================================================

interface CanonicalCategoryCascadeProps {
  /** Category slug in ID-slug format (e.g., "72-vinhos-tintos") */
  selectedCategorySlug: string
  /** Called with the new slug when category changes */
  onCategoryChange: (categorySlug: string) => void
}

function useCanonicalCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["canonicalCategories", "tree"],
    queryFn: async () => {
      const res = await axios.get("/api/categories/canonical")
      return res.data.data as CanonicalCategory[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return { categories: data ?? [], isLoading }
}

function CanonicalCategoryCascade({ selectedCategorySlug, onCategoryChange }: CanonicalCategoryCascadeProps) {
  const { categories, isLoading } = useCanonicalCategories()

  // Parse the category ID from the slug (e.g., "72-vinhos-tintos" -> 72)
  const selectedId = parseCategoryId(selectedCategorySlug)

  // Find the selected category and its ancestors
  const findCategoryPath = useMemo(() => {
    if (!selectedId || !categories.length) return { level1: null, level2: null, level3: null }

    // Build a flat map for quick lookup
    const flatMap = new Map<number, CanonicalCategory>()
    const addToMap = (cats: CanonicalCategory[]) => {
      for (const cat of cats) {
        flatMap.set(cat.id, cat)
        if (cat.children?.length) addToMap(cat.children)
      }
    }
    addToMap(categories)

    const selected = flatMap.get(selectedId)
    if (!selected) return { level1: null, level2: null, level3: null }

    // Walk up the tree to find ancestors
    if (selected.level === 1) {
      return { level1: selected, level2: null, level3: null }
    } else if (selected.level === 2) {
      const parent = selected.parent_id ? flatMap.get(selected.parent_id) : null
      return { level1: parent ?? null, level2: selected, level3: null }
    } else if (selected.level === 3) {
      const parent = selected.parent_id ? flatMap.get(selected.parent_id) : null
      const grandparent = parent?.parent_id ? flatMap.get(parent.parent_id) : null
      return { level1: grandparent ?? null, level2: parent ?? null, level3: selected }
    }

    return { level1: null, level2: null, level3: null }
  }, [selectedId, categories])

  // Get level 1 options (root categories)
  const level1Options = categories

  // Get level 2 options (children of selected level 1)
  const level2Options = useMemo(() => {
    if (!findCategoryPath.level1) return []
    return findCategoryPath.level1.children ?? []
  }, [findCategoryPath.level1])

  // Get level 3 options (children of selected level 2)
  const level3Options = useMemo(() => {
    if (!findCategoryPath.level2) return []
    return findCategoryPath.level2.children ?? []
  }, [findCategoryPath.level2])

  // Helper to create slug from category
  const getCategorySlug = (cat: CanonicalCategory) => toCategorySlug(cat.id, cat.name)

  // Handler for level 1 change - resets level 2 and 3
  const handleLevel1Change = (value: string) => {
    if (value === "_all") {
      onCategoryChange("")
    } else {
      // Find the category to get its name for the slug
      const cat = level1Options.find((c) => String(c.id) === value)
      onCategoryChange(cat ? getCategorySlug(cat) : "")
    }
  }

  // Handler for level 2 change - resets level 3
  const handleLevel2Change = (value: string) => {
    if (value === "_all" && findCategoryPath.level1) {
      // Go back to level 1 selection
      onCategoryChange(getCategorySlug(findCategoryPath.level1))
    } else {
      const cat = level2Options.find((c) => String(c.id) === value)
      onCategoryChange(cat ? getCategorySlug(cat) : "")
    }
  }

  // Handler for level 3 change
  const handleLevel3Change = (value: string) => {
    if (value === "_all" && findCategoryPath.level2) {
      // Go back to level 2 selection
      onCategoryChange(getCategorySlug(findCategoryPath.level2))
    } else {
      const cat = level3Options.find((c) => String(c.id) === value)
      onCategoryChange(cat ? getCategorySlug(cat) : "")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-px">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-px">
      {/* Level 1: Main Category */}
      <div className="p-px">
        <Label className="text-muted-foreground mb-1 block text-xs">Category</Label>
        <Select
          value={findCategoryPath.level1 ? String(findCategoryPath.level1.id) : "_all"}
          onValueChange={handleLevel1Change}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-full text-sm",
              findCategoryPath.level1 && "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
            )}
          >
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="_all">All categories</SelectItem>
            <SelectSeparator />
            {level1Options.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level 2: Subcategory */}
      <div>
        <Label className="text-muted-foreground mb-1 block text-xs">Subcategory</Label>
        <Select
          value={findCategoryPath.level2 ? String(findCategoryPath.level2.id) : "_all"}
          onValueChange={handleLevel2Change}
          disabled={!findCategoryPath.level1}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-full text-sm",
              findCategoryPath.level2 && "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
            )}
          >
            <SelectValue placeholder={findCategoryPath.level1 ? "All subcategories" : "Select category first"} />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            <SelectItem value="_all">All subcategories</SelectItem>
            {level2Options.length > 0 && <SelectSeparator />}
            {level2Options.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level 3: Sub-subcategory */}
      <div>
        <Label className="text-muted-foreground mb-1 block text-xs">Sub-subcategory</Label>
        <Select
          value={findCategoryPath.level3 ? String(findCategoryPath.level3.id) : "_all"}
          onValueChange={handleLevel3Change}
          disabled={!findCategoryPath.level2 || level3Options.length === 0}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-full text-sm",
              findCategoryPath.level3 && "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
            )}
          >
            <SelectValue
              placeholder={
                !findCategoryPath.level2
                  ? "Select subcategory first"
                  : level3Options.length === 0
                    ? "No sub-subcategories"
                    : "All sub-subcategories"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            <SelectItem value="_all">All sub-subcategories</SelectItem>
            {level3Options.length > 0 && <SelectSeparator />}
            {level3Options.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface PaginationControlsProps {
  currentPage: number
  totalPages: number | null
  hasNextPage: boolean
  isLoading: boolean
  onPageChange: (page: number) => void
  className?: string
}

function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  isLoading,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const isNextDisabled = isLoading || !hasNextPage

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
        Previous
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
        <span className="bg-foreground text-background flex size-4 items-center justify-center rounded-full text-xs font-medium">
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
        Next
        <ChevronRightIcon className="h-4 w-4" />
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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:py-16">
      {/* Icon with gradient ring */}
      <div className="relative mb-6">
        <div className="from-primary/50 via-primary/30 to-primary/10 absolute -inset-4 rounded-full bg-linear-to-b blur-xl" />
        <div className="bg-muted/50 ring-foreground/10 relative flex h-20 w-20 items-center justify-center rounded-full ring-1">
          <SearchIcon className="text-muted-foreground h-9 w-9" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold tracking-tight">No results found</h3>

      {/* Description */}
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {query ? (
          <>
            We couldn&apos;t find any products matching &quot;
            <span className="text-foreground font-medium">{query}</span>&quot;. Try a different search term or clear
            your filters.
          </>
        ) : (
          "Try adjusting your filters to find what you're looking for."
        )}
      </p>

      {/* Actions - stacked on mobile */}
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
        <Button variant="outline" className="h-10 w-full px-5 sm:w-auto" onClick={onClearFilters}>
          <RefreshCcwIcon className="h-4 w-4" />
          Clear filters
        </Button>
        <Button
          variant="active"
          className="text-muted-foreground hover:text-foreground h-10 w-full px-5 sm:w-auto"
          onClick={() => router.push("/")}
        >
          <HomeIcon className="h-4 w-4" />
          Return home
        </Button>
      </div>
    </div>
  )
}

function BottomPagination({
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
  return (
    <div className="mt-8 flex items-center justify-between border-t py-4">
      <div className="text-muted-foreground flex w-full flex-col text-sm">
        <span>
          Showing <span className="text-foreground font-semibold">{showingFrom}</span> to{" "}
          <span className="text-foreground font-semibold">{showingTo}</span>
          {totalCount != null && (
            <>
              {" "}
              of <span className="text-foreground font-semibold">{totalCount}</span>
            </>
          )}{" "}
          results
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
