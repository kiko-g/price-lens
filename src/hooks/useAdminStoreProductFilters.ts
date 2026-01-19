import { useState, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export const ORIGIN_OPTIONS = [
  { id: 1, name: "Continente", hasBarcode: true },
  { id: 2, name: "Auchan", hasBarcode: true },
  { id: 3, name: "Pingo Doce", hasBarcode: false },
] as const

export const PRIORITY_LEVELS = [5, 4, 3, 2, 1, 0] as const

export interface AdminStoreProductFilters {
  origins: number[]
  priorities: number[]
  missingBarcode: boolean
  available: boolean | null
  onlyUrl: boolean
}

export interface UseAdminStoreProductFiltersOptions {
  /** API endpoint for fetching count (default: /api/admin/bulk-scrape) */
  countEndpoint?: string
  /** Query key prefix for react-query (default: "admin-store-products") */
  queryKeyPrefix?: string
  /** Initial filter values */
  initialFilters?: Partial<AdminStoreProductFilters>
  /** Stale time for count query in ms (default: 30000) */
  staleTime?: number
}

const DEFAULT_FILTERS: AdminStoreProductFilters = {
  origins: [],
  priorities: [],
  missingBarcode: false,
  available: null,
  onlyUrl: false,
}

export function useAdminStoreProductFilters(options: UseAdminStoreProductFiltersOptions = {}) {
  const {
    countEndpoint = "/api/admin/bulk-scrape",
    queryKeyPrefix = "admin-store-products",
    initialFilters = {},
    staleTime = 30000,
  } = options

  const queryClient = useQueryClient()

  // Merge initial filters with defaults (memoized to avoid recreating on every render)
  const mergedInitialFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...initialFilters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialFilters should only be read once on mount
    [],
  )

  // Filter states
  const [origins, setOrigins] = useState<number[]>(() => mergedInitialFilters.origins)
  const [priorities, setPriorities] = useState<number[]>(() => mergedInitialFilters.priorities)
  const [missingBarcode, setMissingBarcode] = useState(() => mergedInitialFilters.missingBarcode)
  const [available, setAvailable] = useState<boolean | null>(() => mergedInitialFilters.available)
  const [onlyUrl, setOnlyUrl] = useState(() => mergedInitialFilters.onlyUrl)

  // Toggle functions
  const toggleOrigin = useCallback((originId: number) => {
    setOrigins((prev) => (prev.includes(originId) ? prev.filter((id) => id !== originId) : [...prev, originId]))
  }, [])

  const togglePriority = useCallback((priorityId: number) => {
    setPriorities((prev) =>
      prev.includes(priorityId) ? prev.filter((id) => id !== priorityId) : [...prev, priorityId],
    )
  }, [])

  const toggleMissingBarcode = useCallback(() => {
    setMissingBarcode((prev) => !prev)
  }, [])

  // Computed filter params string for API calls
  const filterParamsString = useMemo(() => {
    const params = new URLSearchParams()
    // Always send origins - empty string means "all origins" (no filter)
    params.set("origins", origins.join(","))
    if (priorities.length > 0) params.set("priorities", priorities.join(","))
    params.set("missingBarcode", String(missingBarcode))
    if (available !== null) params.set("available", String(available))
    params.set("onlyUrl", String(onlyUrl))
    return params.toString()
  }, [origins, priorities, missingBarcode, available, onlyUrl])

  // Computed filters object for POST/PATCH requests
  const filters = useMemo<AdminStoreProductFilters>(
    () => ({
      origins,
      priorities,
      missingBarcode,
      available,
      onlyUrl,
    }),
    [origins, priorities, missingBarcode, available, onlyUrl],
  )

  // Count query
  const {
    data: countData,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useQuery({
    queryKey: [queryKeyPrefix, "count", filterParamsString],
    queryFn: async () => {
      const res = await axios.get(`${countEndpoint}?${filterParamsString}`)
      return res.data as { count: number }
    },
    staleTime,
  })

  const count = countData?.count ?? 0

  // Invalidate count query
  const invalidateCount = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "count"] })
  }, [queryClient, queryKeyPrefix])

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setOrigins(mergedInitialFilters.origins)
    setPriorities(mergedInitialFilters.priorities)
    setMissingBarcode(mergedInitialFilters.missingBarcode)
    setAvailable(mergedInitialFilters.available)
    setOnlyUrl(mergedInitialFilters.onlyUrl)
  }, [mergedInitialFilters])

  return {
    // Filter states
    origins,
    priorities,
    missingBarcode,
    available,
    onlyUrl,

    // Setters
    setOrigins,
    setPriorities,
    setMissingBarcode,
    setAvailable,
    setOnlyUrl,

    // Toggle functions
    toggleOrigin,
    togglePriority,
    toggleMissingBarcode,

    // Computed values
    filters,
    filterParamsString,

    // Count query
    count,
    isLoadingCount,
    refetchCount,
    invalidateCount,

    // Utils
    resetFilters,

    // Constants for UI rendering
    originOptions: ORIGIN_OPTIONS,
    priorityLevels: PRIORITY_LEVELS,
  }
}
