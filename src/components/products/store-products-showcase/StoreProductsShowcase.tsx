"use client"

import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { PrioritySource } from "@/types"
import { useStoreProducts, fetchStoreProducts } from "@/hooks/useStoreProducts"
import { useTrackedDebouncedCallback } from "@/hooks/useTrackedDebouncedCallback"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { searchTypes, type SearchType, type SortByType, DEFAULT_BROWSE_SORT } from "@/types/business"
import { PRODUCT_PRIORITY_LEVELS } from "@/lib/business/priority"
import { cn, serializeArray } from "@/lib/utils"
import { UTILITY_SORT_OPTIONS, ALL_SORT_LABELS } from "@/lib/business/filters"

import {
  FILTER_DEBOUNCE_MS,
  FILTER_CONFIG,
  parseCategoryId,
  parseArrayParam,
  useUrlState,
  buildQueryParams,
} from "./url-state"
import { CanonicalCategoryCascade } from "./CategoryFilter"
import { MobileFiltersDrawer, MobileNav } from "./MobileFiltersDrawer"
import { ProductBatchMilestone } from "./ProductBatchMilestone"
import { PriceRangeFilter, SmartViewPresets } from "./FilterControls"
import { PaginationControls, BottomPagination } from "./PaginationControls"
import { DebounceProgressBar, LoadingGrid, EmptyState } from "./StateViews"

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
import { StoreProductCard } from "@/components/products/StoreProductCard"
import { ErrorStateView } from "@/components/ui/combo/state-views"
import { AuchanSvg, ContinenteSvg, PingoDoceSvg } from "@/components/logos"
import { getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { PriorityBubble } from "@/components/products/PriorityBubble"
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper"
import { ScrapeUrlDialog } from "@/components/admin/ScrapeUrlDialog"
import { BulkPriorityDialog } from "@/components/admin/BulkPriorityDialog"
import { TrackingInformationDialog } from "@/components/admin/TrackingInformationDialog"

import {
  BadgePercentIcon,
  BotIcon,
  CircleCheckIcon,
  CrownIcon,
  HandIcon,
  InfoIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  RefreshCcwIcon,
} from "lucide-react"

interface StoreProductsShowcaseProps {
  limit?: number
  children?: React.ReactNode
}

export function StoreProductsShowcase({ limit = 20, children }: StoreProductsShowcaseProps) {
  const router = useRouter()
  const { urlState, updateUrl, pageTitle } = useUrlState()

  useEffect(() => {
    if (!urlState.query.trim() && urlState.sortBy === "relevance") {
      updateUrl({ sort: DEFAULT_BROWSE_SORT, page: 1 })
    }
  }, [urlState.query, urlState.sortBy, updateUrl])

  const DEFAULT_ACCORDION_VALUES = ["sort", "store-origin", "price-range", "categories", "brand"]

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
    brand: urlState.brand,
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
      localFilters.priceMax !== urlState.priceMax ||
      localFilters.brand !== urlState.brand
    )
  }, [queryInput, localFilters, urlState])

  // Desktop: show our overlay for any URL update (page, sort, filters) so we don't see Next.js "Rendering..." badge
  const [isNavigating, setIsNavigating] = useState(false)
  const urlStateKeyWhenNavigatingRef = useRef<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

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
  const [showLoadingMoreUi, setShowLoadingMoreUi] = useState(false)

  useEffect(() => {
    if (!isLoadingMore) {
      setShowLoadingMoreUi(false)
      return
    }
    const t = window.setTimeout(() => setShowLoadingMoreUi(true), 220)
    return () => window.clearTimeout(t)
  }, [isLoadingMore])

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
        brand: urlState.brand,
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
      brand: urlState.brand,
    })
  }, [urlState])

  const sortOptionsForSelect = useMemo(() => {
    const hasSearch = Boolean(queryInput.trim()) || Boolean(urlState.query.trim())
    if (hasSearch) return UTILITY_SORT_OPTIONS
    return UTILITY_SORT_OPTIONS.filter((o) => o.value !== "relevance")
  }, [queryInput, urlState.query])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearch = () => {
    debouncedUpdateUrl.cancel()

    updateUrlWithOverlay({
      q: queryInput,
      t: localFilters.searchType,
      sort: localFilters.sortBy,
      origin: localFilters.origin || null,
      priority: localFilters.priority || null,
      source: localFilters.source || null,
      category: localFilters.category || null,
      brand: localFilters.brand.trim() || null,
      priority_order: localFilters.orderByPriority,
      available: localFilters.onlyAvailable,
      discounted: localFilters.onlyDiscounted,
      price_min: localFilters.priceMin || null,
      price_max: localFilters.priceMax || null,
      page: 1,
    })
  }

  const urlStateKey = useMemo(() => JSON.stringify(urlState), [urlState])

  useEffect(() => {
    if (!isNavigating || urlStateKeyWhenNavigatingRef.current === null) return
    if (urlStateKey !== urlStateKeyWhenNavigatingRef.current) {
      urlStateKeyWhenNavigatingRef.current = null
      setIsNavigating(false)
    }
  }, [isNavigating, urlStateKey])

  useEffect(() => {
    if (!isNavigating) return
    const t = setTimeout(() => {
      urlStateKeyWhenNavigatingRef.current = null
      setIsNavigating(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [isNavigating])

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
      brand: localFilters.brand.trim() || null,
      priority_order: localFilters.orderByPriority,
      available: localFilters.onlyAvailable,
      discounted: localFilters.onlyDiscounted,
      page: newPage,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSortChange = (newSort: SortByType) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: newSort }))
    debouncedUpdateUrl({ sort: newSort, page: 1 })
  }

  const handleSearchTypeChange = (newType: SearchType) => {
    setLocalFilters((prev) => ({ ...prev, searchType: newType }))
    debouncedUpdateUrl({ t: newType })
  }

  const handleTogglePriorityOrder = () => {
    const newValue = !localFilters.orderByPriority
    setLocalFilters((prev) => ({ ...prev, orderByPriority: newValue }))
    debouncedUpdateUrl({ priority_order: newValue, page: 1 })
  }

  const handleToggleDiscounted = () => {
    const newValue = !localFilters.onlyDiscounted
    setLocalFilters((prev) => ({ ...prev, onlyDiscounted: newValue }))
    debouncedUpdateUrl({ discounted: newValue, page: 1 })
  }

  const handleToggleAvailable = () => {
    const newValue = !localFilters.onlyAvailable
    setLocalFilters((prev) => ({ ...prev, onlyAvailable: newValue }))
    debouncedUpdateUrl({ available: newValue, page: 1 })
  }

  const handleOriginToggle = (originId: number) => {
    const isSelected = selectedOrigins.includes(originId)
    const updated = isSelected ? selectedOrigins.filter((v) => v !== originId) : [...selectedOrigins, originId]
    const serialized = serializeArray(updated) ?? ""
    setLocalFilters((prev) => ({ ...prev, origin: serialized }))
    debouncedUpdateUrl({ origin: serialized || null, page: 1 })
  }

  const handleSetOrigins = (originIds: number[]) => {
    const serialized = serializeArray(originIds) ?? ""
    setLocalFilters((prev) => ({ ...prev, origin: serialized }))
    debouncedUpdateUrl({ origin: serialized || null, page: 1 })
  }

  const handleClearOrigins = () => {
    setLocalFilters((prev) => ({ ...prev, origin: "" }))
    debouncedUpdateUrl({ origin: null, page: 1 })
  }

  const handlePriorityToggle = (level: number) => {
    const isSelected = selectedPriorities.includes(level)
    const updated = isSelected ? selectedPriorities.filter((v) => v !== level) : [...selectedPriorities, level]
    const serialized = serializeArray(updated) ?? ""
    setLocalFilters((prev) => ({ ...prev, priority: serialized }))
    debouncedUpdateUrl({ priority: serialized || null, page: 1 })
  }

  const handleClearPriority = () => {
    setLocalFilters((prev) => ({ ...prev, priority: "" }))
    debouncedUpdateUrl({ priority: null, page: 1 })
  }

  const handleSourceToggle = (source: PrioritySource) => {
    const isSelected = selectedSources.includes(source)
    const updated = isSelected ? selectedSources.filter((v) => v !== source) : [...selectedSources, source]
    const serialized = updated.length > 0 ? updated.join(",") : ""
    setLocalFilters((prev) => ({ ...prev, source: serialized }))
    debouncedUpdateUrl({ source: serialized || null, page: 1 })
  }

  const handleClearSources = () => {
    setLocalFilters((prev) => ({ ...prev, source: "" }))
    debouncedUpdateUrl({ source: null, page: 1 })
  }

  const handleCategoryChange = (categorySlug: string) => {
    setLocalFilters((prev) => ({ ...prev, category: categorySlug }))
    debouncedUpdateUrl({ category: categorySlug || null, page: 1 })
  }

  const handleClearCategory = () => {
    setLocalFilters((prev) => ({ ...prev, category: "" }))
    debouncedUpdateUrl({ category: null, page: 1 })
  }

  const handleBrandInputChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, brand: value }))
    debouncedUpdateUrl({ brand: value.trim() ? value : null, page: 1 })
  }

  const handleClearBrand = () => {
    setLocalFilters((prev) => ({ ...prev, brand: "" }))
    debouncedUpdateUrl({ brand: null, page: 1 })
  }

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
      brand: FILTER_CONFIG.brand.default,
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

  // Auto-load more on mobile when sentinel scrolls into view
  useEffect(() => {
    if (isDesktop || !mobileHasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore && !isLoading) {
          handleLoadMore()
        }
      },
      { rootMargin: "300px" },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isDesktop, mobileHasMore, isLoadingMore, isLoading, handleLoadMore])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (urlState.origin) count++
    if (urlState.category) count++
    if (urlState.priority) count++
    if (urlState.source) count++
    if (urlState.onlyDiscounted) count++
    if (urlState.sortBy !== FILTER_CONFIG.sortBy.default) count++
    if (urlState.priceMin || urlState.priceMax) count++
    if (urlState.brand.trim()) count++
    return count
  }, [urlState])

  // Filter parts for the mobile search bar badge pills when filters are active but no query
  const filterParts = useMemo((): string[] => {
    if (!activeFilterCount) return []
    const parts: string[] = []
    if (selectedOrigins.length === 1) {
      const name = getSupermarketChainName(selectedOrigins[0])
      if (name) parts.push(name)
    } else if (selectedOrigins.length > 1) {
      parts.push(`${selectedOrigins.length} stores`)
    }
    if (urlState.category) {
      const name = urlState.category.replace(/^\d+-/, "").replace(/-/g, " ")
      parts.push(name.charAt(0).toUpperCase() + name.slice(1))
    }
    if (urlState.onlyDiscounted) parts.push("On sale")
    if (urlState.brand.trim()) {
      const brands = urlState.brand
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      parts.push(brands.length === 1 ? brands[0]! : `${brands.length} brands`)
    }
    if (urlState.priceMin && urlState.priceMax) parts.push(`${urlState.priceMin}–${urlState.priceMax}€`)
    else if (urlState.priceMin) parts.push(`From ${urlState.priceMin}€`)
    else if (urlState.priceMax) parts.push(`Up to ${urlState.priceMax}€`)
    return parts.slice(0, 3)
  }, [activeFilterCount, selectedOrigins, urlState])

  const bulkPriorityFilterParams = useMemo(() => {
    const params = new URLSearchParams()
    if (urlState.query) {
      params.set("q", urlState.query)
      params.set("searchType", urlState.searchType)
    }
    if (urlState.origin) params.set("origin", urlState.origin)
    if (urlState.priority) params.set("priority", urlState.priority)
    if (urlState.source) params.set("source", urlState.source)
    const catId = parseCategoryId(urlState.category)
    if (catId) params.set("canonicalCat", String(catId))
    if (urlState.onlyDiscounted) params.set("onlyDiscounted", "true")
    if (urlState.brand.trim()) params.set("brand", urlState.brand.trim())
    return params.toString()
  }, [urlState])

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
    if (urlState.brand.trim()) parts.push(`Brand: ${urlState.brand.trim()}`)
    if (urlState.onlyDiscounted) parts.push("Only discounted")
    return parts.length > 0 ? parts.join(" • ") : "No filters applied (all products)"
  }, [urlState, selectedOrigins, selectedPriorities, selectedSources])

  if (isError) {
    return (
      <div className="flex flex-1 items-start justify-center">
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

        {/* Search Input */}
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
                        {sortOptionsForSelect.map((option) => (
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

            {/* Brand filter */}
            <AccordionItem value="brand">
              <AccordionTrigger className="cursor-pointer justify-between gap-2 py-2 text-sm font-medium hover:no-underline">
                Brand
                {localFilters.brand.trim() && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearBrand()
                    }}
                    className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                  >
                    Clear
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent className="p-px pb-3">
                <Input
                  placeholder="e.g. Kinder, Nestlé (comma-separated)"
                  className="text-sm"
                  value={localFilters.brand}
                  onChange={(e) => handleBrandInputChange(e.target.value)}
                  aria-label="Filter by brand names"
                />
                <p className="text-muted-foreground mt-1.5 text-xs">
                  Exact store brand names; separate multiple with commas.
                </p>
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

            {/* Insiders (dev only) */}
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
        hasMoreProducts={mobileHasMore}
        activeFilterCount={activeFilterCount}
        filterParts={filterParts}
        onFilterPress={() => setMobileFiltersOpen(true)}
      />

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        activeFilterCount={activeFilterCount}
        searchQueryForSort={queryInput.trim() || urlState.query.trim()}
        localFilters={localFilters}
        selectedOrigins={selectedOrigins}
        selectedPriorities={selectedPriorities}
        onSetOrigins={handleSetOrigins}
        onPriorityToggle={handlePriorityToggle}
        onClearPriority={handleClearPriority}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onTogglePriorityOrder={handleTogglePriorityOrder}
        onToggleAvailable={handleToggleAvailable}
        onToggleDiscounted={handleToggleDiscounted}
        onBrandChange={handleBrandInputChange}
        onPriceRangeChange={(min, max) => {
          setLocalFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }))
          debouncedUpdateUrl({ price_min: min || null, price_max: max || null, page: 1 })
        }}
      />

      {/* Main Content Area */}
      <div data-main-scroll className="relative flex w-full flex-1 flex-col px-3 py-2 sm:px-4 sm:py-3 lg:h-full lg:overflow-y-auto">
        {/* Pull-to-refresh indicator (mobile) */}
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
                {displayProducts.flatMap((product, idx) => {
                  const nodes: ReactNode[] = [
                    <StoreProductCard key={product.id} sp={product} imagePriority={isDesktop ? idx < 20 : idx < 10} />,
                  ]
                  if (!isDesktop && (idx + 1) % limit === 0 && idx + 1 < displayProducts.length) {
                    nodes.push(<ProductBatchMilestone key={`batch-${idx + 1}`} loaded={idx + 1} />)
                  }
                  return nodes
                })}
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

            {/* Mobile: infinite scroll sentinel + status */}
            <div className="my-6 flex flex-col items-center gap-3 lg:hidden">
              {mobileHasMore ? (
                <>
                  <div ref={sentinelRef} className="h-px w-full" aria-hidden />
                  {showLoadingMoreUi && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Loading more...</span>
                    </div>
                  )}
                  <p className="text-muted-foreground text-center text-xs">
                    {totalCount != null ? (
                      <>
                        Showing <span className="text-foreground font-semibold">{displayProducts.length}</span> of{" "}
                        <span className="text-foreground font-semibold">{totalCount}</span> products
                      </>
                    ) : (
                      <>
                        Showing <span className="text-foreground font-semibold">{displayProducts.length}</span> products
                        <span className="text-muted-foreground/80"> · scroll for more</span>
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-center text-xs">
                  {totalCount != null ? (
                    <>
                      Showing all <span className="text-foreground font-semibold">{totalCount}</span> products matching
                      filters
                    </>
                  ) : (
                    <>
                      <span className="text-foreground font-semibold">{displayProducts.length}</span> products match
                      your filters
                    </>
                  )}
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
