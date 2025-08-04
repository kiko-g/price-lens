"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"
import type { UserFavorite, StoreProduct } from "@/types"
import type { User } from "@supabase/supabase-js"

interface FavoriteWithProduct extends UserFavorite {
  store_products: StoreProduct
}

interface PaginatedFavoritesResponse {
  data: FavoriteWithProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function useFavorites(page: number = 1, limit: number = 20) {
  const { user } = useUser()
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchFavorites = useCallback(
    async (pageNum: number = page, limitNum: number = limit) => {
      if (!user) return

      setIsLoading(true)
      try {
        const searchParams = new URLSearchParams({
          page: pageNum.toString(),
          limit: limitNum.toString(),
        })

        const response = await fetch(`/api/favorites?${searchParams}`)
        if (response.ok) {
          const result: PaginatedFavoritesResponse = await response.json()
          setFavorites(result.data)
          setPagination(result.pagination)
        }
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [user, page, limit],
  )

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const addFavorite = useCallback(
    async (storeProductId: number) => {
      if (!user) {
        toast.error("Please log in to add favorites")
        return false
      }

      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_product_id: storeProductId }),
        })

        if (response.ok) {
          toast.success("Added to favorites")
          await fetchFavorites() // Refresh the list
          return true
        } else {
          const error = await response.json()
          toast.error(error.error || "Failed to add to favorites")
          return false
        }
      } catch (error) {
        console.error("Error adding favorite:", error)
        toast.error("Failed to add to favorites")
        return false
      }
    },
    [user, fetchFavorites],
  )

  const removeFavorite = useCallback(
    async (storeProductId: number) => {
      if (!user) return false

      try {
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_product_id: storeProductId }),
        })

        if (response.ok) {
          toast.success("Removed from favorites")
          await fetchFavorites() // Refresh the list
          return true
        } else {
          const error = await response.json()
          toast.error(error.error || "Failed to remove from favorites")
          return false
        }
      } catch (error) {
        console.error("Error removing favorite:", error)
        toast.error("Failed to remove from favorites")
        return false
      }
    },
    [user, fetchFavorites],
  )

  const toggleFavorite = useCallback(
    async (storeProductId: number, isFavorited: boolean) => {
      if (isFavorited) {
        return await removeFavorite(storeProductId)
      } else {
        return await addFavorite(storeProductId)
      }
    },
    [addFavorite, removeFavorite],
  )

  const isFavorited = useCallback(
    (storeProductId: number) => {
      return favorites.some((fav) => fav.store_product_id === storeProductId)
    },
    [favorites],
  )

  const goToNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchFavorites(pagination.page + 1, pagination.limit)
    }
  }, [pagination, fetchFavorites])

  const goToPreviousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      fetchFavorites(pagination.page - 1, pagination.limit)
    }
  }, [pagination, fetchFavorites])

  const goToPage = useCallback(
    (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= pagination.totalPages) {
        fetchFavorites(pageNum, pagination.limit)
      }
    },
    [pagination, fetchFavorites],
  )

  return {
    favorites,
    pagination,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refresh: fetchFavorites,
    goToNextPage,
    goToPreviousPage,
    goToPage,
  }
}

export function useFavoriteStatus(storeProductId: number | null) {
  const { user } = useUser()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkFavoriteStatus = useCallback(async () => {
    if (!user || !storeProductId) {
      setIsFavorited(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/favorites/check/${storeProductId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.is_favorited)
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, storeProductId])

  useEffect(() => {
    checkFavoriteStatus()
  }, [checkFavoriteStatus])

  const toggleFavorite = useCallback(async () => {
    if (!user || !storeProductId) {
      toast.error("Please log in to manage favorites")
      return false
    }

    setIsLoading(true)
    try {
      const method = isFavorited ? "DELETE" : "POST"
      const response = await fetch("/api/favorites", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ store_product_id: storeProductId }),
      })

      if (response.ok) {
        const newStatus = !isFavorited
        setIsFavorited(newStatus)
        toast.success(newStatus ? "Added to favorites" : "Removed from favorites")
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update favorites")
        return false
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Failed to update favorites")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, storeProductId, isFavorited])

  return {
    isFavorited,
    isLoading,
    toggleFavorite,
    refresh: checkFavoriteStatus,
  }
}

export function useFavoritesInfiniteScroll(user: User | null, limit: number = 20) {
  const [accumulatedFavorites, setAccumulatedFavorites] = useState<FavoriteWithProduct[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // Early return with empty state if no user
  const hasValidUser = Boolean(user?.id)

  const loadingRef = useRef(false)
  const limitRef = useRef(limit)

  useEffect(() => {
    limitRef.current = limit
  }, [limit])

  // Stable fetch function
  const fetchFavorites = useCallback(
    async (pageNum: number = 1, reset: boolean = false) => {
      if (!hasValidUser) return

      const currentLimit = limitRef.current
      setIsLoading(true)
      loadingRef.current = true

      try {
        const searchParams = new URLSearchParams({
          page: pageNum.toString(),
          limit: currentLimit.toString(),
        })

        const response = await fetch(`/api/favorites?${searchParams}`)
        if (response.ok) {
          const result: PaginatedFavoritesResponse = await response.json()

          setAccumulatedFavorites((prev) => {
            return reset || pageNum === 1 ? result.data : [...prev, ...result.data]
          })

          setTotal(result.pagination.total)
          setHasMore(result.pagination.hasNextPage)
          setCurrentPage(pageNum)
        }
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setIsLoading(false)
        loadingRef.current = false
      }
    },
    [hasValidUser], // Only recreate if user validity changes
  )

  // Only run effects if user is valid
  useEffect(() => {
    if (hasValidUser) {
      fetchFavorites(1, true)
    } else {
      // Reset state when no user
      setAccumulatedFavorites([])
      setCurrentPage(1)
      setHasMore(true)
      setTotal(0)
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [hasValidUser, fetchFavorites])

  // Scroll handler - only attach if user is valid
  const handleScroll = useCallback(() => {
    if (!hasValidUser || loadingRef.current || !hasMore || isLoading) return

    const scrolledToBottom =
      window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 100

    if (scrolledToBottom) {
      fetchFavorites(currentPage + 1, false)
    }
  }, [hasValidUser, hasMore, isLoading, currentPage, fetchFavorites])

  useEffect(() => {
    if (!hasValidUser) return // Don't even attach scroll listener

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasValidUser, handleScroll])

  const addFavorite = useCallback(
    async (storeProductId: number) => {
      if (!hasValidUser) {
        toast.error("Please log in to add favorites")
        return false
      }

      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_product_id: storeProductId }),
        })

        if (response.ok) {
          toast.success("Added to favorites")
          await fetchFavorites(1, true)
          return true
        } else {
          const error = await response.json()
          toast.error(error.error || "Failed to add to favorites")
          return false
        }
      } catch (error) {
        console.error("Error adding favorite:", error)
        toast.error("Failed to add to favorites")
        return false
      }
    },
    [hasValidUser, fetchFavorites],
  )

  const removeFavorite = useCallback(
    async (storeProductId: number) => {
      if (!hasValidUser) return false

      try {
        const response = await fetch("/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_product_id: storeProductId }),
        })

        if (response.ok) {
          toast.success("Removed from favorites")
          // Optimistic update
          setAccumulatedFavorites((prev) => prev.filter((fav) => fav.store_product_id !== storeProductId))
          setTotal((prev) => Math.max(0, prev - 1))
          return true
        } else {
          const error = await response.json()
          toast.error(error.error || "Failed to remove from favorites")
          return false
        }
      } catch (error) {
        console.error("Error removing favorite:", error)
        toast.error("Failed to remove from favorites")
        return false
      }
    },
    [hasValidUser],
  )

  const toggleFavorite = useCallback(
    async (storeProductId: number, isFavorited: boolean) => {
      if (!hasValidUser) return false

      if (isFavorited) {
        return await removeFavorite(storeProductId)
      } else {
        return await addFavorite(storeProductId)
      }
    },
    [hasValidUser, addFavorite, removeFavorite],
  )

  const isFavorited = useCallback(
    (storeProductId: number) => {
      if (!hasValidUser) return false
      return accumulatedFavorites.some((fav) => fav.store_product_id === storeProductId)
    },
    [hasValidUser, accumulatedFavorites],
  )

  const refresh = useCallback(() => {
    if (!hasValidUser) return
    fetchFavorites(1, true)
  }, [hasValidUser, fetchFavorites])

  // Return early state if no user - prevents unnecessary work
  if (!hasValidUser) {
    return {
      favorites: [],
      total: 0,
      isLoading: false,
      hasMore: false,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorited,
      refresh,
    }
  }

  return {
    favorites: accumulatedFavorites,
    total,
    isLoading,
    hasMore,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refresh,
  }
}
