"use client"

import { useState, useEffect } from "react"
import { useStoreProducts, type StoreProductWithMeta } from "@/hooks/useStoreProducts"

interface UseLiveSearchOptions {
  debounceMs?: number
  minChars?: number
  limit?: number
  enabled?: boolean
}

interface UseLiveSearchReturn {
  results: StoreProductWithMeta[]
  isLoading: boolean
  isDebouncing: boolean
  isEmpty: boolean
}

export function useLiveSearch(query: string, options: UseLiveSearchOptions = {}): UseLiveSearchReturn {
  const { debounceMs = 400, minChars = 3, limit = 5, enabled = true } = options

  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isDebouncing, setIsDebouncing] = useState(false)

  // debounce the query
  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < minChars) {
      setDebouncedQuery("")
      setIsDebouncing(false)
      return
    }

    setIsDebouncing(true)

    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed)
      setIsDebouncing(false)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, minChars])

  const shouldFetch = enabled && debouncedQuery.length >= minChars

  const { data, isLoading, isFetching } = useStoreProducts(
    {
      search: { query: debouncedQuery, searchIn: "any" },
      pagination: { page: 1, limit },
      sort: { sortBy: "a-z", prioritizeByPriority: true },
      flags: { onlyAvailable: true, onlyTracked: true },
    },
    {
      enabled: shouldFetch,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  )

  return {
    results: shouldFetch ? data : [],
    isLoading: shouldFetch && (isLoading || isFetching),
    isDebouncing,
    isEmpty: shouldFetch && !isLoading && !isFetching && data.length === 0,
  }
}
