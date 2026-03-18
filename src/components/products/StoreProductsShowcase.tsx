"use client"

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { PrioritySource, CanonicalCategory } from "@/types"

import {
  useStoreProducts,
  fetchStoreProducts,
  SupermarketChain,
  type StoreProductsQueryParams,
} from "@/hooks/useStoreProducts"
import { useTrackedDebouncedCallback } from "@/hooks/useTrackedDebouncedCallback"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { searchTypes, type SearchType, type SortByType } from "@/types/business"
import { PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import { cn, getCenteredArray, serializeArray } from "@/lib/utils"
import { SORT_OPTIONS_GROUPS, SMART_VIEW_PRESETS, UTILITY_SORT_OPTIONS, ALL_SORT_LABELS } from "@/lib/business/filters"
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
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { StoreProductCardSkeleton } from "@/components/products/skeletons/StoreProductCardSkeleton"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"

import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { SearchContainer } from "@/components/layout/search"
import { ScrapeUrlDialog } from "@/components/admin/ScrapeUrlDialog"
import { BulkPriorityDialog } from "@/components/admin/BulkPriorityDialog"
import { TrackingInformationDialog } from "@/components/admin/TrackingInformationDialog"

import {
  BadgePercentIcon,
  BotIcon,
  CircleCheckIcon,
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
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

const FILTER_DEBOUNCE_MS = 500 // Debounce delay for filter changes

function DebounceProgressBar({ durationMs }: { durationMs: number }) {
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="bg-foreground/20 hidden h-[5px] w-16 overflow-hidden rounded-full md:block">
      <div
        className="bg-foreground h-full rounded-full transition-[width] ease-linear"
        style={{ width: filled ? "100%" : "0%", transitionDuration: `${durationMs - 100}ms` }}
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
  sortBy: { key: "sort", default: "relevance" },
  origin: { key: "origin", default: "" },
  searchType: { key: "t", default: "any" },
  query: { key: "q", default: "" },
  orderByPriority: { key: "priority_order", default: true },
  onlyAvailable: { key: "available", default: true },
  onlyDiscounted: { key: "discounted", default: false },
  priority: { key: "priority", default: "" },
  source: { key: "source", default: "" },
  category: { key: "category", default: "" },
  priceMin: { key: "price_min", default: "" },
  priceMax: { key: "price_max", default: "" },
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
      priceMin: searchParams.get(FILTER_CONFIG.priceMin.key) ?? FILTER_CONFIG.priceMin.default,
      priceMax: searchParams.get(FILTER_CONFIG.priceMax.key) ?? FILTER_CONFIG.priceMax.default,
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

  const priceMin = urlState.priceMin ? parseFloat(urlState.priceMin) : undefined
  const priceMax = urlState.priceMax ? parseFloat(urlState.priceMax) : undefined
  if ((priceMin != null && !isNaN(priceMin)) || (priceMax != null && !isNaN(priceMax))) {
    params.priceRange = {
      ...(priceMin != null && !isNaN(priceMin) ? { min: priceMin } : {}),
      ...(priceMax != null && !isNaN(priceMax) ? { max: priceMax } : {}),
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

  const DEFAULT_ACCORDION_VALUES = ["sort", "store-origin", "price-range", "categories"]

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
    priceMin: urlState.priceMin,
    priceMax: urlState.priceMax,
  })

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
      localFilters.priceMin !== urlState.priceMin ||
      localFilters.priceMax !== urlState.priceMax
    )
  }, [queryInput, localFilters, urlState])

  // Desktop: show our overlay for any URL update (page, sort, filters) so we don’t see Next.js "Rendering..." badge
  const [isNavigating, setIsNavigating] = useState(false)
  const urlStateKeyWhenNavigatingRef = useRef<string | null>(null)

  const updateUrlWithOverlay = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      urlStateKeyWhenNavigatingRef.current = JSON.stringify(urlState)
      setIsNavigating(true)
      if (isDesktop) {
        startTransition(() => updateUrl(updates))
      } else {
        updateUrl(updates)
      }
    },
    [isDesktop, urlState, updateUrl],
  )

  // Debounced URL sync for filter changes (uses updateUrlWithOverlay on desktop so overlay shows)
  const {
    trigger: debouncedUpdateUrl,
    animKey: debounceAnimKey,
    completed: debounceCompleted,
    setCompleted: setDebounceCompleted,
  } = useTrackedDebouncedCallback(updateUrlWithOverlay, FILTER_DEBOUNCE_MS)

  // Parse origin, priority, and source from local filters (for UI)
  const selectedOrigins = useMemo(() => parseArrayParam(localFilters.origin), [localFilters.origin])
  const selectedPriorities = useMemo(() => parseArrayParam(localFilters.priority), [localFilters.priority])
  const selectedSources = useMemo(() => {
    if (!localFilters.source) return [] as PrioritySource[]
    return localFilters.source.split(",").filter((v): v is PrioritySource => v === "ai" || v === "manual")
  }, [localFilters.source])

  // Build query params from URL state
  const queryParams = useMemo(() => buildQueryParams(urlState, limit), [urlState, limit])

  // Fetch products (page 1 or desktop current page)
  const { data: products, pagination, isLoading, isFetching, isError, error, refetch } = useStoreProducts(queryParams)

  // Mobile "Load More" state: accumulates products beyond page 1
  const [mobileExtraProducts, setMobileExtraProducts] = useState<
    import("@/hooks/useStoreProducts").StoreProductWithMeta[]
  >([])
  const [mobilePage, setMobilePage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [mobileHasMore, setMobileHasMore] = useState(true)

  // Stable filter identity string (excludes page) to detect filter changes
  const filterIdentity = useMemo(
    () =>
      JSON.stringify({
        q: urlState.query,
        sort: urlState.sortBy,
        origin: urlState.origin,
        searchType: urlState.searchType,
        priority: urlState.priority,
        source: urlState.source,
        category: urlState.category,
        orderByPriority: urlState.orderByPriority,
        onlyAvailable: urlState.onlyAvailable,
        onlyDiscounted: urlState.onlyDiscounted,
      }),
    [urlState],
  )

  const prevFilterIdentity = useRef(filterIdentity)
  useEffect(() => {
    if (prevFilterIdentity.current !== filterIdentity) {
      setMobileExtraProducts([])
      setMobilePage(1)
      setMobileHasMore(true)
      prevFilterIdentity.current = filterIdentity
    }
  }, [filterIdentity])

  // Sync mobileHasMore from the first page's pagination
  useEffect(() => {
    if (pagination && mobilePage === 1) {
      setMobileHasMore(pagination.hasNextPage)
    }
  }, [pagination, mobilePage])

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !mobileHasMore) return
    const nextPage = mobilePage + 1
    setIsLoadingMore(true)
    try {
      const nextParams = buildQueryParams({ ...urlState, page: nextPage }, limit)
      const result = await fetchStoreProducts(nextParams)
      setMobileExtraProducts((prev) => [...prev, ...result.data])
      setMobilePage(nextPage)
      setMobileHasMore(result.pagination.hasNextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, mobileHasMore, mobilePage, urlState, limit])

  // On mobile: page-1 products + accumulated extra pages. On desktop: just current page.
  const displayProducts = isDesktop ? products : [...products, ...mobileExtraProducts]

  // Pull-to-refresh (mobile only)
  const handlePullRefresh = useCallback(async () => {
    setMobileExtraProducts([])
    setMobilePage(1)
    setMobileHasMore(true)
    await refetch()
  }, [refetch])

  const {
    pullDistance,
    isRefreshing: isPullRefreshing,
    progress: pullProgress,
  } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    enabled: !isDesktop,
  })

  // Sync local query input when URL changes
  useEffect(() => {
    setQueryInput(urlState.query)
  }, [urlState.query])

  // Pending search navigation state (bridges SearchContent → here)
  // Server prefetch via HydrationBoundary means isFetching is never true when
  // useSearchParams finally updates, so we use a custom event to detect the gap.
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      setPendingSearchQuery((e as CustomEvent<{ query: string }>).detail.query)
    }
    window.addEventListener("products-search-pending", handler)
    return () => window.removeEventListener("products-search-pending", handler)
  }, [])

  useEffect(() => {
    if (pendingSearchQuery !== null && urlState.query === pendingSearchQuery) {
      setPendingSearchQuery(null)
    }
  }, [urlState.query, pendingSearchQuery])

  useEffect(() => {
    if (pendingSearchQuery !== null) {
      const timer = setTimeout(() => setPendingSearchQuery(null), 15_000)
      return () => clearTimeout(timer)
    }
  }, [pendingSearchQuery])

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
      priceMin: urlState.priceMin,
      priceMax: urlState.priceMax,
    })
  }, [urlState])

  // Auto-switch sort to "relevance" when a search query becomes active, and
  // back to the default when cleared. Only triggers on query transitions
  // (empty→non-empty or non-empty→empty), not every keystroke.

  // ============================================================================
  // Handlers
  // ============================================================================

  // Explicit action: flush debounce and update URL immediately
  const handleSearch = () => {
    setMobileFiltersOpen(false)
    debouncedUpdateUrl.cancel()

    updateUrlWithOverlay({
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
      price_min: localFilters.priceMin || null,
      price_max: localFilters.priceMax || null,
      page: 1,
    })
  }

  const urlStateKey = useMemo(() => JSON.stringify(urlState), [urlState])

  // Clear navigating overlay when URL has caught up (any filter/page change on desktop)
  useEffect(() => {
    if (!isNavigating || urlStateKeyWhenNavigatingRef.current === null) return
    if (urlStateKey !== urlStateKeyWhenNavigatingRef.current) {
      urlStateKeyWhenNavigatingRef.current = null
      setIsNavigating(false)
    }
  }, [isNavigating, urlStateKey])

  // Safety: clear navigating if URL never updates (e.g. navigation blocked)
  useEffect(() => {
    if (!isNavigating) return
    const t = setTimeout(() => {
      urlStateKeyWhenNavigatingRef.current = null
      setIsNavigating(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [isNavigating])

  // Explicit action: flush debounce and update URL immediately
  const handlePageChange = (newPage: number) => {
    debouncedUpdateUrl.cancel()
    updateUrlWithOverlay({
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
      priceMin: FILTER_CONFIG.priceMin.default,
      priceMax: FILTER_CONFIG.priceMax.default,
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

  const hasResults = displayProducts.length > 0
  const showingFrom = hasResults ? (currentPage - 1) * limit + 1 : 0
  const showingTo = isDesktop
    ? totalCount != null
      ? Math.min(currentPage * limit, totalCount)
      : (currentPage - 1) * limit + products.length
    : displayProducts.length

  const showSkeletons = isLoading && displayProducts.length === 0
  const isNavigationPending = pendingSearchQuery !== null && pendingSearchQuery !== urlState.query
  // Overlay: we have data but something is in progress (refetch, pending search, or desktop URL update)
  const showOverlay =
    (isFetching && products.length > 0) || (isNavigationPending && displayProducts.length > 0) || isNavigating

  const SLOW_LOAD_THRESHOLD_MS = 6000
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false)
  const slowLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSlowLoadCondition = showSkeletons || showOverlay
  useEffect(() => {
    if (isSlowLoadCondition) {
      setShowSlowLoadMessage(false)
      slowLoadTimerRef.current = setTimeout(() => {
        setShowSlowLoadMessage(true)
        slowLoadTimerRef.current = null
      }, SLOW_LOAD_THRESHOLD_MS)
      return () => {
        if (slowLoadTimerRef.current) {
          clearTimeout(slowLoadTimerRef.current)
          slowLoadTimerRef.current = null
        }
        setShowSlowLoadMessage(false)
      }
    } else {
      if (slowLoadTimerRef.current) {
        clearTimeout(slowLoadTimerRef.current)
        slowLoadTimerRef.current = null
      }
      setShowSlowLoadMessage(false)
    }
  }, [isSlowLoadCondition])

  useEffect(() => {
    return () => {
      if (slowLoadTimerRef.current) {
        clearTimeout(slowLoadTimerRef.current)
        slowLoadTimerRef.current = null
      }
    }
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (urlState.origin) count++
    if (urlState.category) count++
    if (urlState.priority) count++
    if (urlState.source) count++
    if (urlState.onlyDiscounted) count++
    if (urlState.sortBy !== FILTER_CONFIG.sortBy.default) count++
    if (urlState.priceMin || urlState.priceMax) count++
    return count
  }, [urlState])

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
      <div className="flex flex-1 items-start justify-center p-4">
        <ErrorStateView error={error} onRetry={() => refetch()} />
      </div>
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

        {process.env.NODE_ENV === "development" && (
          <TrackingInformationDialog>
            <button className="text-muted-foreground mb-4 text-left text-sm hover:opacity-80">
              <InfoIcon className="mb-px inline-block size-3.5" /> Products have priority levels from 0 to 5. When
              favorited, products are assigned 5
            </button>
          </TrackingInformationDialog>
        )}

        {/* Search Input (debounced, no button on desktop) */}
        <div className="relative w-full">
          <Input
            type="search"
            enterKeyHint="search"
            placeholder="Search products..."
            className="pr-16 text-base md:text-sm"
            value={queryInput}
            onChange={(e) => {
              const value = e.target.value
              setQueryInput(value)
              const updates: Record<string, string | number | boolean | null> = { q: value || null, page: 1 }

              if (value.trim() && localFilters.sortBy === (FILTER_CONFIG.sortBy.default as string)) {
                setLocalFilters((prev) => ({ ...prev, sortBy: "relevance" as SortByType }))
                updates.sort = "relevance"
              } else if (!value.trim() && localFilters.sortBy === "relevance") {
                setLocalFilters((prev) => ({ ...prev, sortBy: FILTER_CONFIG.sortBy.default as SortByType }))
                updates.sort = null
              }

              debouncedUpdateUrl(updates)
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
          <Accordion type="multiple" className="w-full border-t" defaultValue={DEFAULT_ACCORDION_VALUES}>
            {/* Sort Options */}
            <AccordionItem value="sort">
              <AccordionTrigger className="cursor-pointer justify-start gap-2 py-2 text-sm font-medium hover:no-underline">
                <span className="flex flex-1 items-center gap-1">
                  <span>Sort By</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-px pb-3">
                {(() => {
                  const info = ALL_SORT_LABELS[localFilters.sortBy]
                  const SortIcon = info?.icon
                  const isPresetControlled = !UTILITY_SORT_OPTIONS.some((o) => o.value === localFilters.sortBy)
                  // const isNonDefault = localFilters.sortBy !== FILTER_CONFIG.sortBy.default
                  return (
                    <Select value={localFilters.sortBy} onValueChange={(v) => handleSortChange(v as SortByType)}>
                      <SelectTrigger
                        className={cn(
                          "h-8 w-full",
                          isPresetControlled && "text-muted-foreground",
                          "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
                        )}
                      >
                        <div className="flex w-full items-center gap-2 truncate text-sm">
                          {SortIcon && <SortIcon className="h-4 w-4 shrink-0" />}
                          <span>{info?.label ?? localFilters.sortBy}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {UTILITY_SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                })()}
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

            {/* Price Range Filter */}
            <AccordionItem value="price-range">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Price Range
                {(localFilters.priceMin || localFilters.priceMax) && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setLocalFilters((prev) => ({ ...prev, priceMin: "", priceMax: "" }))
                      debouncedUpdateUrl({ price_min: null, price_max: null, page: 1 })
                    }}
                    className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                  >
                    Clear
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <PriceRangeFilter
                  priceMin={localFilters.priceMin}
                  priceMax={localFilters.priceMax}
                  onChange={(min, max) => {
                    setLocalFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }))
                    debouncedUpdateUrl({
                      price_min: min || null,
                      price_max: max || null,
                      page: 1,
                    })
                  }}
                />
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

            {/* Insiders (dev only) — consolidated admin controls */}
            {process.env.NODE_ENV === "development" && (
              <AccordionItem value="insiders">
                <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                  <span className="flex flex-1 items-center gap-1">
                    Insiders
                    <DevBadge />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="flex flex-col gap-3">
                    {/* Toggle options */}
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Options
                      </span>
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
                          Only available
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

                    {/* Priority filter */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                          Priority
                        </span>
                        {selectedPriorities.length > 0 && (
                          <button
                            onClick={handleClearPriority}
                            className="text-muted-foreground hover:text-foreground text-xs hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
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

                    {/* Priority source filter */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                          Priority Source
                        </span>
                        {selectedSources.length > 0 && (
                          <button
                            onClick={handleClearSources}
                            className="text-muted-foreground hover:text-foreground text-xs hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNav
        query={urlState.query}
        isSearching={isSearching}
        loadedCount={displayProducts.length}
        totalCount={totalCount}
        activeFilterCount={activeFilterCount}
        onFilterPress={() => setMobileFiltersOpen(true)}
      />

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        activeFilterCount={activeFilterCount}
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
        onSortChange={handleSortChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleAvailable={handleToggleAvailable}
        onToggleDiscounted={handleToggleDiscounted}
        onPriceRangeChange={(min, max) => {
          setLocalFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }))
        }}
        onApply={handleSearch}
      />

      {/* Main Content Area */}
      <div data-main-scroll className="relative flex w-full flex-1 flex-col p-4 lg:h-full lg:overflow-y-auto">
        {/* Pull-to-refresh indicator (mobile) - absolute overlay, no layout shift */}
        {(pullDistance > 0 || isPullRefreshing) && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center lg:hidden"
            style={{ transform: `translateY(${Math.min(pullDistance, 60) - 8}px)` }}
          >
            <div
              className={cn(
                "bg-background flex h-8 w-8 items-center justify-center rounded-full border shadow-md",
                isPullRefreshing && "animate-spin",
              )}
              style={{ opacity: isPullRefreshing ? 1 : pullProgress }}
            >
              <RefreshCcwIcon className="text-muted-foreground h-4 w-4" />
            </div>
          </div>
        )}

        {/* Products Grid */}
        {showSkeletons ? (
          <div className="flex w-full flex-col gap-3">
            <LoadingGrid limit={limit} />
            {showSlowLoadMessage && (
              <div className="text-muted-foreground flex flex-col items-center gap-1 text-center text-sm">
                <p>This is taking longer than usual. Hold on…</p>
              </div>
            )}
          </div>
        ) : displayProducts.length > 0 ? (
          <>
            {/* Smart View Presets */}
            <SmartViewPresets
              urlState={urlState}
              isLoading={isSearching}
              onApply={(presetParams) => {
                debouncedUpdateUrl.cancel()
                updateUrlWithOverlay({ ...presetParams, page: 1 })
              }}
            />

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
              {showOverlay && (
                <>
                  {/* Desktop: blur overlay with centered label */}
                  <div className="bg-background/60 absolute inset-0 z-10 hidden items-start justify-center pt-24 backdrop-blur-[2px] lg:flex">
                    <div className="bg-background flex flex-col items-center gap-1 rounded-lg border px-4 py-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">
                          {showSlowLoadMessage ? "This is taking longer than usual. Hold on…" : "Loading..."}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Mobile: progress bar + fade overlay */}
                  <div className="absolute inset-0 z-10 lg:hidden">
                    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
                      <div className="bg-primary h-full w-1/3 animate-[progressSlide_1s_ease-in-out_infinite] rounded-full" />
                    </div>
                    <div className="bg-background/40 absolute inset-0" />
                  </div>
                </>
              )}

              <ProductGridWrapper
                className={cn("w-full transition-opacity duration-200", showOverlay && "pointer-events-none")}
              >
                {displayProducts.map((product, idx) => (
                  <StoreProductCard key={product.id} sp={product} imagePriority={isDesktop ? idx < 20 : idx < 10} />
                ))}
              </ProductGridWrapper>
            </div>

            {/* Desktop: page-based pagination */}
            <div className="hidden lg:block">
              <BottomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                showingFrom={showingFrom}
                showingTo={showingTo}
                totalCount={totalCount}
                hasNextPage={hasNextPage}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Mobile: Load More button */}
            <div className="my-6 flex flex-col items-center gap-3 lg:hidden">
              {mobileHasMore ? (
                <Button variant="outline" className="w-full max-w-xs" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more products"
                  )}
                </Button>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Showing all <span className="text-foreground font-semibold">{totalCount}</span> products matching
                  filters
                </p>
              )}
              {mobileHasMore && totalCount != null && (
                <p className="text-muted-foreground text-xs">
                  Showing <span className="text-foreground font-semibold">{displayProducts.length}</span> of{" "}
                  <span className="text-foreground font-semibold">{totalCount}</span> products
                </p>
              )}
            </div>

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

const PRICE_RANGE_CHIPS = [
  { label: "Under 2€", min: "", max: "2" },
  { label: "2–5€", min: "2", max: "5" },
  { label: "5–10€", min: "5", max: "10" },
  { label: "10€+", min: "10", max: "" },
] as const

function PriceRangeFilter({
  priceMin,
  priceMax,
  onChange,
}: {
  priceMin: string
  priceMax: string
  onChange: (min: string, max: string) => void
}) {
  const activeChipIdx = PRICE_RANGE_CHIPS.findIndex((c) => c.min === priceMin && c.max === priceMax)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRICE_RANGE_CHIPS.map((chip, idx) => (
          <button
            key={chip.label}
            onClick={() => {
              if (activeChipIdx === idx) {
                onChange("", "")
              } else {
                onChange(chip.min, chip.max)
              }
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activeChipIdx === idx
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground hover:bg-accent border-border",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          className="h-8 max-w-[33%] text-xs md:h-7 md:max-w-full"
          value={priceMin}
          min={0}
          step={0.5}
          onChange={(e) => onChange(e.target.value, priceMax)}
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number"
          placeholder="Max"
          className="h-8 max-w-[33%] text-xs md:h-7 md:max-w-full"
          value={priceMax}
          min={0}
          step={0.5}
          onChange={(e) => onChange(priceMin, e.target.value)}
        />
      </div>
    </div>
  )
}

function SmartViewPresets({
  urlState,
  isLoading,
  onApply,
}: {
  urlState: { sortBy: SortByType; onlyDiscounted: boolean; priority: string; query: string }
  isLoading?: boolean
  onApply: (params: Record<string, string | number | boolean | null>) => void
}) {
  const isPresetActive = (preset: (typeof SMART_VIEW_PRESETS)[number]) => {
    return Object.entries(preset.params).every(([key, value]) => {
      if (key === "sort") return urlState.sortBy === value
      if (key === "discounted") return urlState.onlyDiscounted === (value === "true")
      if (key === "priority") return urlState.priority === value
      return false
    })
  }

  return (
    <div className="no-scrollbar mb-3 flex h-8 max-h-8 min-h-8 flex-1 gap-2 self-stretch overflow-x-auto">
      {SMART_VIEW_PRESETS.map((preset) => {
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
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "from-primary/80 to-secondary/80 text-primary-foreground shadow-primary/25 dark:from-primary/60 dark:to-secondary/60 dark:shadow-primary/15 border-transparent bg-linear-to-br shadow-md"
                : "border-border/40 bg-muted/50 text-muted-foreground hover:border-border/70 hover:bg-muted hover:text-foreground dark:border-border/25 dark:bg-muted/30 dark:hover:border-border/50 dark:hover:bg-muted/60",
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

interface MobileNavProps {
  query: string
  isSearching: boolean
  loadedCount: number
  totalCount: number | null
  activeFilterCount: number
  onFilterPress: () => void
}

function MobileNav({ query, isSearching, loadedCount, totalCount, activeFilterCount, onFilterPress }: MobileNavProps) {
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
              {isSearching ? (
                <Loader2Icon className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              <span
                className={cn("flex-1 truncate text-left text-sm", query ? "text-foreground" : "text-muted-foreground")}
              >
                {query || "Search products..."}
              </span>
              {loadedCount > 0 && totalCount != null && (
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {loadedCount}/{totalCount}
                </span>
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

interface MobileFiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeFilterCount: number
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
    priceMin: string
    priceMax: string
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
  onSortChange: (sort: SortByType) => void
  onTogglePriorityOrder: () => void
  onToggleAvailable: () => void
  onToggleDiscounted: () => void
  onPriceRangeChange: (min: string, max: string) => void
  onApply: () => void
}

function MobileFiltersDrawer({
  open,
  onOpenChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeFilterCount,
  localFilters,
  selectedOrigins,
  selectedPriorities,
  onOriginToggle,
  onClearOrigins,
  onPriorityToggle,
  onClearPriority,
  onCategoryChange,
  onSortChange,
  onTogglePriorityOrder,
  onToggleAvailable,
  onToggleDiscounted,
  onPriceRangeChange,
  onApply,
}: MobileFiltersDrawerProps) {
  const DEFAULT_ACCORDION_VALUES_MOBILE = ["sort", "store-origin", "price-range"]
  const [view, setView] = useState<"filters" | "categories">("filters")
  const { categories } = useCanonicalCategories()
  const flatCategories = useFlatCategories(categories)
  const selectedCatId = parseCategoryId(localFilters.category)
  const selectedCat = flatCategories.find((c) => c.id === selectedCatId)

  useEffect(() => {
    if (!open) setView("filters")
  }, [open])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85svh] lg:hidden">
        {view === "categories" ? (
          <MobileCategoryPickerView
            categories={categories}
            flatCategories={flatCategories}
            selectedCategorySlug={localFilters.category}
            onSelect={(slug) => {
              onCategoryChange(slug)
              setView("filters")
            }}
            onBack={() => setView("filters")}
          />
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle className="text-left">Filters & Sort</DrawerTitle>
            </DrawerHeader>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto border-t px-4">
              {/* Category — opens dedicated full-screen picker */}
              <button
                type="button"
                onClick={() => setView("categories")}
                className="flex w-full items-center justify-between border-b py-4"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-semibold">Category</span>
                  <span className="text-muted-foreground text-xs">
                    {selectedCat ? selectedCat.breadcrumb : "All categories"}
                  </span>
                </div>
                <ChevronRightIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              </button>

              <Accordion type="multiple" defaultValue={DEFAULT_ACCORDION_VALUES_MOBILE}>
                <AccordionItem value="sort">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-sm font-semibold">Sort By</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup
                      value={localFilters.sortBy}
                      onValueChange={(v) => onSortChange(v as SortByType)}
                      className="gap-0"
                    >
                      {SORT_OPTIONS_GROUPS.map((group, gi) => (
                        <div key={group.label} className={cn(gi > 0 && "border-border mt-2 border-t pt-2")}>
                          <span className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wider uppercase">
                            {group.label}
                          </span>
                          {group.options.map((option) => {
                            console.info(option.value, localFilters.sortBy)
                            return (
                              <label
                                key={option.value}
                                className={cn(
                                  "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors",
                                  localFilters.sortBy === option.value && "bg-accent dark:bg-accent/50",
                                )}
                              >
                                <option.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                                <span className="flex-1 text-sm">{option.label}</span>
                                <RadioGroupItem value={option.value} className="shrink-0" />
                              </label>
                            )
                          })}
                        </div>
                      ))}
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="store-origin">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Store Origin</span>
                      {selectedOrigins.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onClearOrigins()
                          }}
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
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
                  </AccordionContent>
                </AccordionItem>

                {/* Price Range Mobile */}
                <AccordionItem value="price-range">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Price Range</span>
                      {(localFilters.priceMin || localFilters.priceMax) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onPriceRangeChange("", "")
                          }}
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PriceRangeFilter
                      priceMin={localFilters.priceMin}
                      priceMax={localFilters.priceMax}
                      onChange={onPriceRangeChange}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Insiders (dev only) — consolidated admin controls */}
                {process.env.NODE_ENV === "development" && (
                  <AccordionItem value="insiders" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        Insiders
                        <DevBadge />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            Options
                          </span>
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
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mobile-only-available"
                              checked={localFilters.onlyAvailable}
                              onCheckedChange={onToggleAvailable}
                            />
                            <Label
                              htmlFor="mobile-only-available"
                              className="flex w-full cursor-pointer items-center gap-2 text-sm hover:opacity-80"
                            >
                              <CircleCheckIcon className="h-4 w-4" />
                              Only available
                            </Label>
                          </div>
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
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                              Priority
                            </span>
                            {selectedPriorities.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onClearPriority()
                                }}
                                className="text-muted-foreground text-xs hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
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
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>

            <DrawerFooter className="flex-row gap-2 border-t px-4">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button className="flex-1" onClick={onApply}>
                Apply Filters
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// ============================================================================
// Mobile Category Picker (full-screen drill-down)
// ============================================================================

function categoryContainsId(cat: CanonicalCategory, targetId: number): boolean {
  if (cat.id === targetId) return true
  return cat.children?.some((child) => categoryContainsId(child, targetId)) ?? false
}

interface MobileCategoryPickerViewProps {
  categories: CanonicalCategory[]
  flatCategories: FlatCategory[]
  selectedCategorySlug: string
  onSelect: (slug: string) => void
  onBack: () => void
}

function MobileCategoryPickerView({
  categories,
  flatCategories,
  selectedCategorySlug,
  onSelect,
  onBack,
}: MobileCategoryPickerViewProps) {
  const [navStack, setNavStack] = useState<CanonicalCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  const selectedId = parseCategoryId(selectedCategorySlug)
  const selectedCat = flatCategories.find((c) => c.id === selectedId)

  const currentParent = navStack[navStack.length - 1] ?? null
  const currentItems = currentParent?.children ?? categories
  const title = currentParent?.name ?? "Categories"

  const handleDrillDown = (cat: CanonicalCategory) => {
    setNavStack((prev) => [...prev, cat])
    listRef.current?.scrollTo({ top: 0 })
  }

  const handleGoBack = () => {
    if (navStack.length > 0) {
      setNavStack((prev) => prev.slice(0, -1))
      listRef.current?.scrollTo({ top: 0 })
    } else {
      onBack()
    }
  }

  const handleSelect = (cat: { id: number; name: string } | null) => {
    if (!cat) {
      onSelect("")
      return
    }
    const slug = toCategorySlug(cat.id, cat.name)
    onSelect(cat.id === selectedId ? "" : slug)
  }

  const isSearching = searchQuery.length > 1
  const searchResults = isSearching
    ? flatCategories.filter((c) => {
        const normalize = (s: string) =>
          s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        return normalize(c.breadcrumb).includes(normalize(searchQuery))
      })
    : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={handleGoBack}
          className="active:bg-accent -ml-1 flex h-8 w-8 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            inputMode="search"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Current selection banner */}
      {selectedCat && !isSearching && (
        <div className="bg-primary/10 dark:bg-primary/15 mx-4 mb-3 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-xs">
            <span className="text-muted-foreground">Selected: </span>
            <span className="font-medium">{selectedCat.breadcrumb}</span>
          </span>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="text-muted-foreground ml-2 text-xs font-medium hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Category list */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
        {isSearching ? (
          searchResults.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">No categories found.</p>
          ) : (
            searchResults.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id === selectedId ? "" : cat.slug)}
                className={cn(
                  "active:bg-accent flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  cat.id === selectedId && "bg-accent/50",
                )}
              >
                <CircleCheckIcon
                  className={cn("h-4 w-4 shrink-0", cat.id === selectedId ? "text-primary" : "text-transparent")}
                />
                <span className="flex-1 text-[15px]">
                  {cat.level === 1 ? (
                    <span className="font-medium">{cat.name}</span>
                  ) : (
                    <span>
                      <span className="text-muted-foreground text-xs">
                        {cat.breadcrumb.split(" > ").slice(0, -1).join(" > ")} &gt;{" "}
                      </span>
                      <span className="font-medium">{cat.name}</span>
                    </span>
                  )}
                </span>
              </button>
            ))
          )
        ) : (
          <>
            {/* Root: "All categories" / Drilled: "All in [parent]" */}
            <button
              type="button"
              onClick={() => handleSelect(currentParent)}
              className={cn(
                "active:bg-accent flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors",
                (!selectedId && !currentParent) || (currentParent && currentParent.id === selectedId)
                  ? "bg-accent/50"
                  : "",
              )}
            >
              <CircleCheckIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  (!selectedId && !currentParent) || (currentParent && currentParent.id === selectedId)
                    ? "text-primary"
                    : "text-transparent",
                )}
              />
              <span className="flex-1 text-[15px] font-medium">
                {currentParent ? `All in ${currentParent.name}` : "All categories"}
              </span>
            </button>

            {currentItems.map((cat) => {
              const hasChildren = (cat.children?.length ?? 0) > 0
              const containsSelected = selectedId ? categoryContainsId(cat, selectedId) : false
              const isExactMatch = cat.id === selectedId

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => (hasChildren ? handleDrillDown(cat) : handleSelect(cat))}
                  className={cn(
                    "active:bg-accent flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                    isExactMatch && "bg-accent/50",
                  )}
                >
                  {isExactMatch ? (
                    <CircleCheckIcon className="text-primary h-4 w-4 shrink-0" />
                  ) : containsSelected ? (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 text-[15px]">{cat.name}</span>
                  {hasChildren && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <span className="text-xs">{cat.children!.length}</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Canonical Category Search Filter
// ============================================================================

interface CategoryFilterProps {
  selectedCategorySlug: string
  onCategoryChange: (categorySlug: string) => void
  /** "popover" for desktop sidebar, "inline" for mobile drawer */
  variant?: "popover" | "inline"
  className?: string
}

type FlatCategory = {
  id: number
  name: string
  breadcrumb: string
  level: 1 | 2 | 3
  slug: string
}

function useCanonicalCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ["canonicalCategories", "tree"],
    queryFn: async () => {
      const res = await axios.get("/api/categories/canonical")
      return res.data.data as CanonicalCategory[]
    },
    staleTime: 1000 * 60 * 60,
  })

  return { categories: data ?? [], isLoading }
}

function useFlatCategories(categories: CanonicalCategory[]) {
  return useMemo(() => {
    const flat: FlatCategory[] = []
    const walk = (cats: CanonicalCategory[], ancestors: string[]) => {
      for (const cat of cats) {
        const path = [...ancestors, cat.name]
        flat.push({
          id: cat.id,
          name: cat.name,
          breadcrumb: path.join(" > "),
          level: cat.level,
          slug: toCategorySlug(cat.id, cat.name),
        })
        if (cat.children?.length) walk(cat.children, path)
      }
    }
    walk(categories, [])
    return flat
  }, [categories])
}

function CategorySearchList({
  flatCategories,
  selectedSlug,
  onSelect,
}: {
  flatCategories: FlatCategory[]
  selectedSlug: string
  onSelect: (slug: string) => void
}) {
  const selectedId = parseCategoryId(selectedSlug)

  return (
    <Command className="rounded-md border" shouldFilter>
      <CommandInput placeholder="Search categories..." className="h-9 border-0 focus:ring-0" />
      <CommandList className="max-h-[280px]">
        <CommandEmpty>No categories found.</CommandEmpty>
        <CommandGroup>
          {flatCategories.map((cat) => (
            <CommandItem
              key={cat.id}
              value={cat.breadcrumb}
              onSelect={() => onSelect(cat.id === selectedId ? "" : cat.slug)}
              className="gap-2"
            >
              <CircleCheckIcon
                className={cn("h-3.5 w-3.5 shrink-0", cat.id === selectedId ? "text-primary opacity-100" : "opacity-0")}
              />
              <span className="flex-1 truncate">
                {cat.level === 1 ? (
                  <span className="font-medium">{cat.name}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {cat.breadcrumb.split(" > ").slice(0, -1).join(" > ")}
                    {" > "}
                    <span className="text-foreground">{cat.name}</span>
                  </span>
                )}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function CanonicalCategoryCascade({
  selectedCategorySlug,
  onCategoryChange,
  variant = "popover",
  className,
}: CategoryFilterProps) {
  const { categories, isLoading } = useCanonicalCategories()
  const flatCategories = useFlatCategories(categories)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const selectedId = parseCategoryId(selectedCategorySlug)
  const selectedCategory = flatCategories.find((c) => c.id === selectedId)

  const handleSelect = useCallback(
    (slug: string) => {
      onCategoryChange(slug)
      setPopoverOpen(false)
    },
    [onCategoryChange],
  )

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />
  }

  if (variant === "inline") {
    return (
      <CategorySearchList flatCategories={flatCategories} selectedSlug={selectedCategorySlug} onSelect={handleSelect} />
    )
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className={cn(
            "h-8 w-full justify-between text-sm font-normal",
            selectedCategory && "border-primary/30 bg-primary/10 dark:border-primary/40 dark:bg-primary/15",
          )}
        >
          <span className="truncate">{selectedCategory ? selectedCategory.breadcrumb : "All categories"}</span>
          <ChevronDownIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-lg min-w-(--radix-popover-trigger-width) p-0", className)} align="start">
        <CategorySearchList
          flatCategories={flatCategories}
          selectedSlug={selectedCategorySlug}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
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
    <div className="flex flex-1 items-start justify-center p-4">
      <EmptyStateView
        title="No results found"
        message={
          query
            ? `We couldn't find any products matching "${query}". Try a different search term or clear your filters.`
            : "Try adjusting your filters to find what you're looking for."
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <RefreshCcwIcon className="size-4" />
              Clear filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <HomeIcon className="size-4" />
              Return home
            </Button>
          </div>
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
