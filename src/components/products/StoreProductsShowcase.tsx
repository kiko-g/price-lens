"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useDebouncedCallback } from "use-debounce"
import axios from "axios"
import { PrioritySource } from "@/types"

import { useStoreProducts, SupermarketChain, type StoreProductsQueryParams } from "@/hooks/useStoreProducts"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { searchTypes, type SearchType, type SortByType, PRODUCT_PRIORITY_LEVELS } from "@/types/business"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import { ScrollArea } from "@/components/ui/scroll-area"

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
  LayersIcon,
  Loader2Icon,
  LoaderPinwheelIcon,
  MoreHorizontalIcon,
  PackageIcon,
  RefreshCcwIcon,
  SearchIcon,
  InfoIcon,
} from "lucide-react"

/**
 * Single source of truth for URL filter parameters.
 * - `key`: The URL search param name
 * - `default`: The default value (omitted from URL when matched)
 */
const FILTER_CONFIG = {
  page: { key: "page", default: 1 },
  sortBy: { key: "sort", default: "a-z" },
  origin: { key: "origin", default: "" },
  searchType: { key: "t", default: "any" },
  query: { key: "q", default: "" },
  orderByPriority: { key: "priority_order", default: false },
  onlyAvailable: { key: "available", default: true },
  onlyDiscounted: { key: "discounted", default: false },
  priority: { key: "priority", default: "" },
  source: { key: "source", default: "" },
  category: { key: "cat", default: "" },
  category2: { key: "cat2", default: "" },
  category3: { key: "cat3", default: "" },
  catTuples: { key: "catTuples", default: "" },
} as const

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
      orderByPriority: searchParams.get(FILTER_CONFIG.orderByPriority.key) === "true",
      onlyAvailable: searchParams.get(FILTER_CONFIG.onlyAvailable.key) !== "false",
      onlyDiscounted: searchParams.get(FILTER_CONFIG.onlyDiscounted.key) === "true",
      priority: searchParams.get(FILTER_CONFIG.priority.key) ?? FILTER_CONFIG.priority.default,
      source: searchParams.get(FILTER_CONFIG.source.key) ?? FILTER_CONFIG.source.default,
      category: searchParams.get(FILTER_CONFIG.category.key) ?? FILTER_CONFIG.category.default,
      category2: searchParams.get(FILTER_CONFIG.category2.key) ?? FILTER_CONFIG.category2.default,
      category3: searchParams.get(FILTER_CONFIG.category3.key) ?? FILTER_CONFIG.category3.default,
      catTuples: searchParams.get(FILTER_CONFIG.catTuples.key) ?? FILTER_CONFIG.catTuples.default,
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
        category: urlState.category,
        onlyDiscounted: urlState.onlyDiscounted,
      }),
    [urlState.query, urlState.sortBy, urlState.origin, urlState.category, urlState.onlyDiscounted],
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

  // Category tuple filter (takes precedence over hierarchy)
  if (urlState.catTuples) {
    const tuples = urlState.catTuples
      .split(";")
      .filter(Boolean)
      .map((tupleStr) => {
        const [category, category_2, category_3] = tupleStr.split("|")
        return {
          category: category || "",
          category_2: category_2 || "",
          category_3: category_3 || undefined,
        }
      })
      .filter((t) => t.category && t.category_2)

    if (tuples.length > 0) {
      params.categories = { tuples }
    }
  } else if (urlState.category || urlState.category2 || urlState.category3) {
    // Category hierarchy filter (fallback)
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

// Debounce delay for filter changes (1.2 seconds)
const FILTER_DEBOUNCE_MS = 1200

export function StoreProductsShowcase({ limit = 40, children }: StoreProductsShowcaseProps) {
  const router = useRouter()
  const { urlState, updateUrl, pageTitle } = useUrlState()

  // Desktop detection (lg breakpoint = 1024px) - debounce only applies on desktop
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // Local input state (for search)
  const [queryInput, setQueryInput] = useState(urlState.query)
  const [isSearching, setIsSearching] = useState(false)
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
    category2: urlState.category2,
    category3: urlState.category3,
    catTuples: urlState.catTuples,
  })

  // Debounced URL sync for filter changes
  const debouncedUpdateUrl = useDebouncedCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      updateUrl(updates)
    },
    FILTER_DEBOUNCE_MS,
  )

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
      localFilters.category !== urlState.category ||
      localFilters.category2 !== urlState.category2 ||
      localFilters.category3 !== urlState.category3 ||
      localFilters.catTuples !== urlState.catTuples
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

  // Track searching state
  useEffect(() => {
    if (isFetching) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [isFetching])

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
      category2: urlState.category2,
      category3: urlState.category3,
      catTuples: urlState.catTuples,
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
      cat: localFilters.category || null,
      cat2: localFilters.category2 || null,
      cat3: localFilters.category3 || null,
      catTuples: localFilters.catTuples || null,
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
      cat: localFilters.category || null,
      cat2: localFilters.category2 || null,
      cat3: localFilters.category3 || null,
      catTuples: localFilters.catTuples || null,
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

  // Category handlers (desktop: debounce URL sync, mobile: no auto-sync)
  const handleCategoryChange = (category: string) => {
    setLocalFilters((prev) => ({ ...prev, category, category2: "", category3: "" }))
    if (isDesktop) debouncedUpdateUrl({ cat: category || null, cat2: null, cat3: null, page: 1 })
  }

  const handleCategory2Change = (category2: string) => {
    setLocalFilters((prev) => ({ ...prev, category2, category3: "" }))
    if (isDesktop) debouncedUpdateUrl({ cat2: category2 || null, cat3: null, page: 1 })
  }

  const handleCategory3Change = (category3: string) => {
    setLocalFilters((prev) => ({ ...prev, category3 }))
    if (isDesktop) debouncedUpdateUrl({ cat3: category3 || null, page: 1 })
  }

  const handleClearCategories = () => {
    setLocalFilters((prev) => ({ ...prev, category: "", category2: "", category3: "" }))
    if (isDesktop) debouncedUpdateUrl({ cat: null, cat2: null, cat3: null, page: 1 })
  }

  const handleClearCatTuples = () => {
    setLocalFilters((prev) => ({ ...prev, catTuples: "" }))
    if (isDesktop) debouncedUpdateUrl({ catTuples: null, page: 1 })
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
      category2: FILTER_CONFIG.category2.default,
      category3: FILTER_CONFIG.category3.default,
      catTuples: FILTER_CONFIG.catTuples.default,
    })
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
    // Category tuples take precedence over hierarchy
    if (urlState.catTuples) {
      params.set("catTuples", urlState.catTuples)
    } else {
      if (urlState.category) params.set("category", urlState.category)
      if (urlState.category2) params.set("category_2", urlState.category2)
      if (urlState.category3) params.set("category_3", urlState.category3)
    }
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
    // Category tuples take precedence
    if (urlState.catTuples) {
      const tupleCount = urlState.catTuples.split(";").filter(Boolean).length
      parts.push(`Category tuples: ${tupleCount} selected`)
    } else {
      if (urlState.category) parts.push(`Category: ${urlState.category}`)
      if (urlState.category2) parts.push(`Subcategory: ${urlState.category2}`)
      if (urlState.category3) parts.push(`Sub-subcategory: ${urlState.category3}`)
    }
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
            Procuts have a priority level, from 0 to 5. When favorited, products are assigned 5{" "}
            <InfoIcon className="inline-block size-3" />
          </button>
        </TrackingInformationDialog>

        {/* Search Input (debounced, no button on desktop) */}
        <div className="relative w-full">
          {isSearching ? (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 animate-spin" />
          ) : hasPendingChanges ? (
            <LoaderPinwheelIcon className="text-primary absolute top-1/2 left-2.5 hidden h-4 w-4 -translate-y-1/2 animate-spin duration-[50] md:block" />
          ) : (
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          )}

          <Input
            type="text"
            placeholder="Search products..."
            className="pr-16 pl-8 text-base md:text-sm"
            value={queryInput}
            onChange={(e) => {
              setQueryInput(e.target.value)
              debouncedUpdateUrl({ q: e.target.value || null, page: 1 })
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Select value={localFilters.searchType} onValueChange={(v) => handleSearchTypeChange(v as SearchType)}>
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

        {/* Product Count */}
        <div className="mt-2 flex flex-col gap-2">
          {showSkeletons ? (
            <Skeleton className="h-4 w-full rounded-md" />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{totalCount}</strong> products found
                {urlState.query && ` matching "${urlState.query}"`}
                {showOverlay && (
                  <span className="text-muted-foreground ml-2 inline-flex items-center gap-1">
                    <Loader2Icon className="h-3 w-3 animate-spin" />
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Filters Accordion */}
          <Accordion type="multiple" className="w-full border-t" defaultValue={["sort", "options", "store-origin"]}>
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
                    {SORT_OPTIONS_GROUPS.map((group) => (
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
                  {PRODUCT_PRIORITY_LEVELS.map((level) => (
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

            {/* Categories Filter */}
            <AccordionItem value="categories">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Categories
                {(localFilters.category || localFilters.category2 || localFilters.category3) && (
                  <>
                    <span className="text-muted-foreground text-xs">
                      ({[localFilters.category, localFilters.category2, localFilters.category3].filter(Boolean).length})
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
                <div className="mb-2 border-b pb-2">
                  <CategoryTupleSheet
                    selectedTuples={localFilters.catTuples}
                    onApply={(tuples) => {
                      setLocalFilters((prev) => ({ ...prev, catTuples: tuples }))
                      debouncedUpdateUrl({ catTuples: tuples || null, page: 1 })
                    }}
                    onClear={handleClearCatTuples}
                    className="bg-primary/10 dark:bg-primary/15 hover:bg-primary/20 dark:hover:bg-primary/25"
                  />
                </div>
                <CategoryCascadeFilter
                  category={localFilters.category}
                  category2={localFilters.category2}
                  category3={localFilters.category3}
                  onCategoryChange={handleCategoryChange}
                  onCategory2Change={handleCategory2Change}
                  onCategory3Change={handleCategory3Change}
                />
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
        onCategory2Change={handleCategory2Change}
        onCategory3Change={handleCategory3Change}
        onClearCategories={handleClearCategories}
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
    category2: string
    category3: string
    catTuples: string
  }
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
    <nav className="sticky top-[54px] z-50 mx-auto flex w-full flex-col gap-0 border-b bg-white/95 px-4 py-3 backdrop-blur backdrop-filter lg:hidden dark:bg-zinc-950/95">
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
    category2: string
    category3: string
    catTuples: string
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
  localFilters,
  selectedOrigins,
  selectedPriorities,
  onOriginToggle,
  onClearOrigins,
  onPriorityToggle,
  onClearPriority,
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
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="text-left">Filters & Sort</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto border-t px-4 pt-4 pb-24">
            {/* Store Origin Filter */}
            <div>
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

            {/* Sort Options */}
            <div>
              <Label className="text-base font-semibold">Sort By</Label>
              <Select value={localFilters.sortBy} onValueChange={(v) => onSortChange(v as SortByType)}>
                <SelectTrigger className="mt-1 h-8 w-full">
                  <SelectValue className="flex items-center gap-2 text-sm" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS_GROUPS.map((group) => (
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
                  ))}
                </SelectContent>
              </Select>
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

            {/* Categories Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Categories</Label>
                {(localFilters.category || localFilters.category2 || localFilters.category3) && (
                  <button onClick={onClearCategories} className="text-muted-foreground text-xs hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <CategoryCascadeFilter
                category={localFilters.category}
                category2={localFilters.category2}
                category3={localFilters.category3}
                onCategoryChange={onCategoryChange}
                onCategory2Change={onCategory2Change}
                onCategory3Change={onCategory3Change}
              />
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
      <div className="p-px">
        <Label className="text-muted-foreground mb-1 block text-xs">Category #1</Label>
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
        <Label className="text-muted-foreground mb-1 block text-xs">Category #2</Label>
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
        <Label className="text-muted-foreground mb-1 block text-xs">Category #3</Label>
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
// Category Tuple Multi-Select (Sheet with Apply Button)
// ============================================================================

interface CategoryTuple {
  category: string
  category_2: string
  category_3?: string
}

interface CategoryTupleSheetProps {
  selectedTuples: string // URL-encoded string: "cat|cat2|cat3;cat|cat2|cat3"
  onApply: (tuples: string) => void
  onClear: () => void
  className?: string
}

function useCategoryTuples() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "tuples"],
    queryFn: async () => {
      const res = await axios.get("/api/categories")
      return res.data.data as {
        category: string[]
        category_2: string[]
        category_3: string[]
        tuples: CategoryTuple[]
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return { tuples: data?.tuples ?? [], isLoading }
}

function CategoryTupleSheet({ selectedTuples, onApply, onClear, className }: CategoryTupleSheetProps) {
  const [open, setOpen] = useState(false)
  const [localTuples, setLocalTuples] = useState(selectedTuples)
  const { tuples, isLoading } = useCategoryTuples()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Sync local state when URL changes (e.g., when cleared externally)
  useEffect(() => {
    setLocalTuples(selectedTuples)
  }, [selectedTuples])

  // Reset local state when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalTuples(selectedTuples)
      setSearchQuery("")
    }
    setOpen(newOpen)
  }

  // Parse local tuples
  const selectedSet = useMemo(() => {
    if (!localTuples) return new Set<string>()
    return new Set(localTuples.split(";").filter(Boolean))
  }, [localTuples])

  // Check if a tuple is selected
  const isTupleSelected = useCallback(
    (tuple: CategoryTuple) => {
      const tupleKey = `${tuple.category}|${tuple.category_2}|${tuple.category_3 ?? ""}`
      if (selectedSet.has(tupleKey)) return true

      if (tuple.category_3) {
        const parent2Way = `${tuple.category}|${tuple.category_2}|`
        return selectedSet.has(parent2Way)
      }

      return false
    },
    [selectedSet],
  )

  // Handle local tuple toggle
  const handleLocalTupleToggle = (tuple: CategoryTuple) => {
    const tupleKey = `${tuple.category}|${tuple.category_2}|${tuple.category_3 ?? ""}`
    const currentTuples = localTuples ? localTuples.split(";").filter(Boolean) : []
    const is2WayTuple = !tuple.category_3

    if (is2WayTuple) {
      const prefix = `${tuple.category}|${tuple.category_2}|`
      const hasBase = currentTuples.includes(tupleKey)

      if (hasBase) {
        const updated = currentTuples.filter((t) => !t.startsWith(prefix) && t !== tupleKey)
        setLocalTuples(updated.join(";"))
      } else {
        const filtered = currentTuples.filter((t) => !t.startsWith(prefix))
        const updated = [...filtered, tupleKey]
        setLocalTuples(updated.join(";"))
      }
    } else {
      const isSelected = currentTuples.includes(tupleKey)

      if (isSelected) {
        const updated = currentTuples.filter((t) => t !== tupleKey)
        setLocalTuples(updated.join(";"))
      } else {
        const parent2Way = `${tuple.category}|${tuple.category_2}|`
        const parentSelected = currentTuples.some((t) => t === parent2Way)
        if (!parentSelected) {
          const updated = [...currentTuples, tupleKey]
          setLocalTuples(updated.join(";"))
        }
      }
    }
  }

  // Group tuples by category
  const groupedTuples = useMemo(() => {
    const groups: Record<string, Record<string, CategoryTuple[]>> = {}
    for (const tuple of tuples) {
      if (!groups[tuple.category]) groups[tuple.category] = {}
      if (!groups[tuple.category][tuple.category_2]) groups[tuple.category][tuple.category_2] = []
      groups[tuple.category][tuple.category_2].push(tuple)
    }
    return groups
  }, [tuples])

  // Filter tuples based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedTuples
    const query = searchQuery.toLowerCase()
    const filtered: Record<string, Record<string, CategoryTuple[]>> = {}

    for (const [cat1, cat2Groups] of Object.entries(groupedTuples)) {
      for (const [cat2, tuplesInGroup] of Object.entries(cat2Groups)) {
        const matchingTuples = tuplesInGroup.filter(
          (t) =>
            t.category.toLowerCase().includes(query) ||
            t.category_2.toLowerCase().includes(query) ||
            (t.category_3 && t.category_3.toLowerCase().includes(query)),
        )
        if (matchingTuples.length > 0) {
          if (!filtered[cat1]) filtered[cat1] = {}
          filtered[cat1][cat2] = matchingTuples
        }
      }
    }
    return filtered
  }, [groupedTuples, searchQuery])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const getSelectedCount = useCallback(
    (category: string) => {
      let count = 0
      const cat2Groups = groupedTuples[category] || {}
      for (const [cat2, tuplesInGroup] of Object.entries(cat2Groups)) {
        const twoWayKey = `${category}|${cat2}|`
        if (selectedSet.has(twoWayKey)) {
          count++
          continue
        }
        for (const tuple of tuplesInGroup) {
          if (tuple.category_3 && isTupleSelected(tuple)) count++
        }
      }
      return count
    },
    [groupedTuples, selectedSet, isTupleSelected],
  )

  const handleApply = () => {
    onApply(localTuples)
    setOpen(false)
  }

  const handleClear = () => {
    setLocalTuples("")
    onClear()
    setOpen(false)
  }

  const totalSelected = localTuples ? localTuples.split(";").filter(Boolean).length : 0
  const hasChanges = localTuples !== selectedTuples
  const categories = Object.keys(filteredGroups).sort()

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4" />
            <span>Category Multi-Select</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedTuples && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
                {selectedTuples.split(";").filter(Boolean).length}
              </span>
            )}
            <span className="text-muted-foreground text-xs">→</span>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayersIcon className="h-5 w-5" />
            Category Multi-Select
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden py-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selection count */}
          {totalSelected > 0 && (
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                <span className="text-foreground font-medium">{totalSelected}</span> categories selected
              </span>
              {hasChanges && <span className="text-xs text-amber-600">• Unsaved changes</span>}
            </div>
          )}

          {/* Categories list */}
          <ScrollArea>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">No categories found</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat1) => {
                  const isExpanded = expandedCategories.has(cat1)
                  const selectedCount = getSelectedCount(cat1)
                  const cat2Groups = filteredGroups[cat1]

                  return (
                    <div key={cat1} className="overflow-hidden rounded-lg border">
                      <button
                        onClick={() => toggleCategory(cat1)}
                        className="hover:bg-muted flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
                      >
                        <span className="truncate">{cat1}</span>
                        <div className="flex items-center gap-2">
                          {selectedCount > 0 && (
                            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                              {selectedCount}
                            </span>
                          )}
                          <span className="text-muted-foreground">{isExpanded ? "−" : "+"}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t px-3 py-2">
                          {Object.entries(cat2Groups)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([cat2, tuplesInGroup]) => {
                              const threeWayTuples = tuplesInGroup
                                .filter((t) => t.category_3)
                                .sort((a, b) => (a.category_3 ?? "").localeCompare(b.category_3 ?? ""))

                              const is2WaySelected = selectedSet.has(`${cat1}|${cat2}|`)

                              return (
                                <div key={cat2} className="py-1.5">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`sheet-${cat1}-${cat2}`}
                                      checked={is2WaySelected}
                                      onCheckedChange={() =>
                                        handleLocalTupleToggle({ category: cat1, category_2: cat2 })
                                      }
                                    />
                                    <Label
                                      htmlFor={`sheet-${cat1}-${cat2}`}
                                      className="cursor-pointer text-sm font-medium"
                                    >
                                      {cat2}
                                      {is2WaySelected && threeWayTuples.length > 0 && (
                                        <span className="text-muted-foreground ml-1 text-xs">
                                          (all {threeWayTuples.length})
                                        </span>
                                      )}
                                    </Label>
                                  </div>

                                  {!is2WaySelected && threeWayTuples.length > 0 && (
                                    <div className="mt-1 ml-6 space-y-1">
                                      {threeWayTuples.map((tuple) => {
                                        const tupleKey = `${tuple.category}|${tuple.category_2}|${tuple.category_3}`
                                        return (
                                          <div key={tupleKey} className="flex items-center gap-2">
                                            <Checkbox
                                              id={`sheet-${tupleKey}`}
                                              checked={selectedSet.has(tupleKey)}
                                              onCheckedChange={() => handleLocalTupleToggle(tuple)}
                                            />
                                            <Label
                                              htmlFor={`sheet-${tupleKey}`}
                                              className="text-muted-foreground cursor-pointer text-xs"
                                            >
                                              {tuple.category_3}
                                            </Label>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer with buttons */}
        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" className="flex-1" onClick={handleClear} disabled={!selectedTuples && !localTuples}>
            Clear All
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Apply{totalSelected > 0 && ` (${totalSelected})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
        <div className="from-primary/20 via-primary/5 absolute -inset-4 rounded-full bg-linear-to-b to-transparent blur-xl" />
        <div className="bg-muted/50 relative flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-white/10">
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
          variant="ghost"
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
