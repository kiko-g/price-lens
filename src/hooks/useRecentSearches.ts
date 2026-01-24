"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "price-lens:recent-searches"
const MAX_SEARCHES = 5

function getStoredSearches(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is string => typeof item === "string")
  } catch {
    return []
  }
}

function setStoredSearches(searches: string[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // storage full or unavailable
  }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([])

  // hydrate from localStorage on mount
  useEffect(() => {
    setSearches(getStoredSearches())
  }, [])

  const addSearch = useCallback((query: string): void => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return

    setSearches((prev) => {
      // remove duplicate if exists, add to front, trim to max
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed)
      const updated = [trimmed, ...filtered].slice(0, MAX_SEARCHES)
      setStoredSearches(updated)
      return updated
    })
  }, [])

  const removeSearch = useCallback((query: string): void => {
    setSearches((prev) => {
      const updated = prev.filter((s) => s.toLowerCase() !== query.toLowerCase())
      setStoredSearches(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback((): void => {
    setSearches([])
    setStoredSearches([])
  }, [])

  return {
    searches,
    addSearch,
    removeSearch,
    clearAll,
    hasSearches: searches.length > 0,
  }
}
