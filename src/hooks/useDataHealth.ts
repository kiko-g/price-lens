import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type {
  CohortResponse,
  CohortType,
  DataHealthHistoryPoint,
  DataHealthSnapshot,
  SuccessorsResponse,
} from "@/types/data-health"

export function useDataHealth() {
  return useQuery({
    queryKey: ["admin-data-health"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/data-health")
      return res.data as DataHealthSnapshot
    },
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDataHealthHistory(days = 30) {
  return useQuery({
    queryKey: ["admin-data-health-history", days],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/data-health?history=${days}`)
      return res.data.history as DataHealthHistoryPoint[]
    },
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDataHealthCohort(type: CohortType, originId?: number | null) {
  return useQuery({
    queryKey: ["admin-data-health-cohort", type, originId],
    queryFn: async () => {
      const params = new URLSearchParams({ type })
      if (originId) params.set("origin", String(originId))
      const res = await axios.get(`/api/admin/data-health/cohorts?${params}`)
      return res.data as CohortResponse
    },
    staleTime: 30_000,
    retry: 1,
  })
}

export function useSuccessorSuggestions() {
  return useQuery({
    queryKey: ["admin-data-health-successors"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/data-health/successors")
      return res.data as SuccessorsResponse
    },
    staleTime: 60_000,
    retry: 1,
  })
}
