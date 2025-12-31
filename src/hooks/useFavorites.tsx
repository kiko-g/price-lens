"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/useUser"
import type { UserFavorite, StoreProduct } from "@/types"
import type { User } from "@supabase/supabase-js"
import { HeartIcon, TriangleIcon } from "lucide-react"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"

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

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchFavoritesCount(userId: string) {
  const response = await axios.get(`/api/favorites/count/${userId}`)
  if (response.status !== 200) throw new Error("Failed to fetch favorites count")
  return response.data as { count: number }
}

async function fetchFavorites(page: number, limit: number) {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  const response = await axios.get(`/api/favorites?${searchParams}`)
  if (response.status !== 200) throw new Error("Failed to fetch favorites")
  return response.data as PaginatedFavoritesResponse
}

async function checkFavoriteStatus(storeProductId: number) {
  const response = await axios.get(`/api/favorites/check/${storeProductId}`)
  if (response.status !== 200) throw new Error("Failed to check favorite status")
  return response.data as { is_favorited: boolean }
}

async function addFavorite(storeProductId: number) {
  const response = await axios.post("/api/favorites", { store_product_id: storeProductId })
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.error || "Failed to add to favorites")
  }
  return response.data
}

async function removeFavorite(storeProductId: number) {
  const response = await axios.delete("/api/favorites", {
    data: { store_product_id: storeProductId },
  })
  if (response.status !== 200) {
    throw new Error(response.data?.error || "Failed to remove from favorites")
  }
  return response.data
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

export function useFavoritesCount(userId: string) {
  const query = useQuery({
    queryKey: ["favoritesCount", userId],
    queryFn: () => fetchFavoritesCount(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
  }
}

export function useFavorites(page: number = 1, limit: number = 20) {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["favorites", page, limit],
    queryFn: () => fetchFavorites(page, limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Added to favorites
          <HeartIcon className="size-3 fill-green-500 stroke-green-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add to favorites")
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Removed from favorites
          <HeartIcon className="size-3 fill-red-500 stroke-red-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove from favorites")
    },
  })

  const toggleFavorite = useCallback(
    async (storeProductId: number, isFavorited: boolean) => {
      if (isFavorited) {
        return removeMutation.mutateAsync(storeProductId).then(() => true).catch(() => false)
      } else {
        return addMutation.mutateAsync(storeProductId).then(() => true).catch(() => false)
      }
    },
    [addMutation, removeMutation],
  )

  const isFavorited = useCallback(
    (storeProductId: number) => {
      return query.data?.data.some((fav) => fav.store_product_id === storeProductId) ?? false
    },
    [query.data],
  )

  const goToNextPage = useCallback(() => {
    if (query.data?.pagination.hasNextPage) {
      queryClient.invalidateQueries({ queryKey: ["favorites", page + 1, limit] })
    }
  }, [query.data, page, limit, queryClient])

  const goToPreviousPage = useCallback(() => {
    if (query.data?.pagination.hasPreviousPage) {
      queryClient.invalidateQueries({ queryKey: ["favorites", page - 1, limit] })
    }
  }, [query.data, page, limit, queryClient])

  return {
    favorites: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading: query.isLoading,
    addFavorite: (id: number) => addMutation.mutateAsync(id).then(() => true).catch(() => false),
    removeFavorite: (id: number) => removeMutation.mutateAsync(id).then(() => true).catch(() => false),
    toggleFavorite,
    isFavorited,
    refresh: () => query.refetch(),
    goToNextPage,
    goToPreviousPage,
    goToPage: (pageNum: number) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", pageNum, limit] })
    },
  }
}

export function useFavoriteStatus(storeProductId: number | null) {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["favoriteStatus", storeProductId],
    queryFn: () => checkFavoriteStatus(storeProductId!),
    enabled: !!user && !!storeProductId,
    staleTime: 1000 * 60 * 2,
  })

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Added to favorites
          <TriangleIcon className="size-3 fill-green-500 stroke-green-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus", storeProductId] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update favorites")
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          Removed from favorites
          <TriangleIcon className="size-3 rotate-180 fill-red-500 stroke-red-500" />
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus", storeProductId] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update favorites")
    },
  })

  const toggleFavorite = useCallback(async () => {
    if (!user || !storeProductId) {
      toast.error("Please log in to manage favorites")
      return false
    }

    const currentStatus = query.data?.is_favorited ?? false
    try {
      if (currentStatus) {
        await removeMutation.mutateAsync(storeProductId)
      } else {
        await addMutation.mutateAsync(storeProductId)
      }
      return true
    } catch {
      return false
    }
  }, [user, storeProductId, query.data, addMutation, removeMutation])

  return {
    isFavorited: query.data?.is_favorited ?? false,
    isLoading: query.isLoading || addMutation.isPending || removeMutation.isPending,
    toggleFavorite,
    refresh: () => query.refetch(),
  }
}

export function useFavoritesInfiniteScroll(user: User | null, limit: number = 20) {
  const queryClient = useQueryClient()
  const hasValidUser = Boolean(user?.id)

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["favoritesInfinite", limit],
    queryFn: ({ pageParam }) => fetchFavorites(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined),
    enabled: hasValidUser,
    staleTime: 1000 * 60 * 2,
  })

  const favorites = infiniteQuery.data?.pages.flatMap((page) => page.data) ?? []
  const total = infiniteQuery.data?.pages[0]?.pagination.total ?? 0

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-2">
          <HeartIcon className="h-4 w-4 text-red-500" />
          Added to favorites
        </div>,
      )
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add to favorites")
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      toast.success("Removed from favorites")
      queryClient.invalidateQueries({ queryKey: ["favoritesInfinite"] })
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] })
      queryClient.invalidateQueries({ queryKey: ["favoriteStatus"] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove from favorites")
    },
  })

  const toggleFavorite = useCallback(
    async (storeProductId: number, isFavorited: boolean) => {
      if (!hasValidUser) return false

      try {
        if (isFavorited) {
          await removeMutation.mutateAsync(storeProductId)
        } else {
          await addMutation.mutateAsync(storeProductId)
        }
        return true
      } catch {
        return false
      }
    },
    [hasValidUser, addMutation, removeMutation],
  )

  const isFavorited = useCallback(
    (storeProductId: number) => {
      if (!hasValidUser) return false
      return favorites.some((fav) => fav.store_product_id === storeProductId)
    },
    [hasValidUser, favorites],
  )

  return {
    favorites,
    total,
    isLoading: infiniteQuery.isLoading,
    hasMore: infiniteQuery.hasNextPage ?? false,
    addFavorite: (id: number) => addMutation.mutateAsync(id).then(() => true).catch(() => false),
    removeFavorite: (id: number) => removeMutation.mutateAsync(id).then(() => true).catch(() => false),
    toggleFavorite,
    isFavorited,
    refresh: () => infiniteQuery.refetch(),
    fetchNextPage: infiniteQuery.fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
  }
}
