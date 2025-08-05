import { useState, useEffect, useCallback } from "react"

interface UseSearchWithDebounceOptions {
  delay?: number
  minLength?: number
}

export function useSearchWithDebounce(options: UseSearchWithDebounceOptions = {}) {
  const { delay = 300, minLength = 3 } = options

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
  }, [])

  useEffect(() => {
    if (query.length === 0 || query.length < minLength) {
      setDebouncedQuery("")
      setIsSearching(false)
      return
    }

    const timer = setTimeout(() => {
      setIsSearching(true)
      setDebouncedQuery(query)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay, minLength])

  const clearSearch = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
    setIsSearching(false)
  }, [])

  return {
    query,
    debouncedQuery,
    isSearching,
    setIsSearching,
    handleQueryChange,
    clearSearch,
  }
}
