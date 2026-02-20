"use client"

import { useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchQuickStoreProducts, type StoreProductWithMeta } from "@/hooks/useStoreProducts"

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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["storeProductsQuick", debouncedQuery, limit],
    queryFn: () => fetchQuickStoreProducts(debouncedQuery, limit),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const results = shouldFetch && data ? data.data : []

  return {
    results,
    isLoading: shouldFetch && (isLoading || isFetching),
    isDebouncing,
    isEmpty: shouldFetch && !isLoading && !isFetching && (!data || data.data.length === 0),
  }
}
