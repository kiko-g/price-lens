import { useState, useEffect, useRef, useMemo } from "react"
import { useStoreProducts } from "@/hooks/useProducts"
import { StoreProduct } from "@/types"
import type { GetAllQuery } from "@/lib/db/queries/types"

interface UseInfiniteStoreProductsOptions {
  limit?: number
  tracked?: boolean
  query?: string
  origin?: string
}

export function useInfiniteStoreProducts(options: UseInfiniteStoreProductsOptions = {}) {
  const { limit = 30, tracked = true, query = "", origin } = options

  const [page, setPage] = useState(1)
  const [accumulated, setAccumulated] = useState<StoreProduct[]>([])
  const [hasMore, setHasMore] = useState(true)
  const loadingRef = useRef(false)

  const storeProductsParams = useMemo(
    (): GetAllQuery => ({
      page,
      limit,
      query,
      origin,
      tracked,
    }),
    [page, limit, query, origin, tracked],
  )

  const { data: storeProducts, isLoading } = useStoreProducts(storeProductsParams)

  // Reset pagination when query or origin id changes
  useEffect(() => {
    setAccumulated([])
    setPage(1)
    loadingRef.current = false
  }, [query, origin])

  // Handle new data from API
  useEffect(() => {
    if (!storeProducts) return

    setAccumulated((prev) => {
      const isFirstPageOrSearch = page === 1 || query !== ""
      return isFirstPageOrSearch ? storeProducts : [...prev, ...storeProducts]
    })

    setHasMore(storeProducts.length === limit)
    loadingRef.current = false
  }, [storeProducts, page, query, limit])

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMore || isLoading) return

      const scrolledToBottom =
        window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 100

      if (scrolledToBottom) {
        loadingRef.current = true
        setPage((prev) => prev + 1)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, isLoading])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return {
    products: accumulated,
    isLoading,
    hasMore,
    page,
    scrollToTop,
  }
}
