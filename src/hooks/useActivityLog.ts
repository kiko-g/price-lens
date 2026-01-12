import { useQuery, keepPreviousData } from "@tanstack/react-query"
import axios from "axios"

interface ActivityLogProduct {
  id: number
  name: string | null
  priority: number | null
  origin_id: number | null
  updated_at: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

interface ActivityLogResponse {
  products: ActivityLogProduct[]
  pagination: Pagination
}

interface UseActivityLogOptions {
  page?: number
  limit?: number
  enabled?: boolean
}

export function useActivityLog({ page = 1, limit = 50, enabled = true }: UseActivityLogOptions = {}) {
  return useQuery({
    queryKey: ["activity-log", page, limit],
    queryFn: async (): Promise<ActivityLogResponse> => {
      const res = await axios.get(`/api/admin/schedule?action=activity-log&page=${page}&limit=${limit}`)
      return res.data
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
    enabled,
  })
}

export type { ActivityLogProduct, Pagination, ActivityLogResponse }
