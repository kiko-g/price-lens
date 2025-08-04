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
          await fetchFavorites()
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
          await fetchFavorites()
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
  const [state, setState] = useState({
    favorites: [] as FavoriteWithProduct[],
    currentPage: 1,
    isLoading: false,
    hasMore: true,
    total: 0,
  })

  const hasValidUser = Boolean(user?.id)
  const loadingRef = useRef(false)
  const limitRef = useRef(limit)
  const initializedRef = useRef(false)

  useEffect(() => {
    limitRef.current = limit
  }, [limit])

  const fetchFavorites = useCallback(
    async (pageNum: number = 1, reset: boolean = false) => {
      if (!hasValidUser) return

      const currentLimit = limitRef.current
      loadingRef.current = true

      if (pageNum === 1) setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const searchParams = new URLSearchParams({
          page: pageNum.toString(),
          limit: currentLimit.toString(),
        })

        const response = await fetch(`/api/favorites?${searchParams}`)
        if (response.ok) {
          const result: PaginatedFavoritesResponse = await response.json()

          setState((prev) => ({
            favorites: reset || pageNum === 1 ? result.data : [...prev.favorites, ...result.data],
            total: result.pagination.total,
            hasMore: result.pagination.hasNextPage,
            currentPage: pageNum,
            isLoading: false,
          }))
        }
      } catch (error) {
        console.error("Error fetching favorites:", error)
        setState((prev) => ({ ...prev, isLoading: false }))
      } finally {
        loadingRef.current = false
      }
    },
    [hasValidUser],
  )

  useEffect(() => {
    if (hasValidUser && !initializedRef.current) {
      initializedRef.current = true
      fetchFavorites(1, true)
    } else if (!hasValidUser) {
      setState({
        favorites: [],
        currentPage: 1,
        hasMore: true,
        total: 0,
        isLoading: false,
      })
      initializedRef.current = false
    }
  }, [hasValidUser, fetchFavorites])

  const handleScroll = useCallback(() => {
    if (!hasValidUser || loadingRef.current || !state.hasMore || state.isLoading) return

    const scrolledToBottom =
      window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 100

    if (scrolledToBottom) fetchFavorites(state.currentPage + 1, false)
  }, [hasValidUser, state.hasMore, state.isLoading, state.currentPage, fetchFavorites])

  useEffect(() => {
    if (!hasValidUser) return

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
          setState((prev) => ({
            ...prev,
            favorites: prev.favorites.filter((fav) => fav.store_product_id !== storeProductId),
            total: Math.max(0, prev.total - 1),
          }))
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
      return state.favorites.some((fav) => fav.store_product_id === storeProductId)
    },
    [hasValidUser, state.favorites],
  )

  const refresh = useCallback(() => {
    if (!hasValidUser) return
    fetchFavorites(1, true)
  }, [hasValidUser, fetchFavorites])

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
    favorites: state.favorites,
    total: state.total,
    isLoading: state.isLoading,
    hasMore: state.hasMore,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    refresh,
  }
}
