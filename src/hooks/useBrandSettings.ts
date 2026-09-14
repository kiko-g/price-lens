import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import type { BrandSettings, BrandSettingsInput } from "@/lib/brand/brand"

const BRAND_SETTINGS_QUERY_KEY = ["admin", "brand-settings"] as const

export type BrandSettingsResponse = {
  brand: BrandSettings
  updatedAt: string | null
}

/** Admin editor read: always the latest stored row (bypasses the public brand cache). */
export function useBrandSettings() {
  return useQuery({
    queryKey: BRAND_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get<BrandSettingsResponse>("/api/admin/brand")
      return data
    },
    staleTime: 0,
  })
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BrandSettingsInput) => {
      const { data } = await axios.put<BrandSettingsResponse>("/api/admin/brand", input)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(BRAND_SETTINGS_QUERY_KEY, data)
      toast.success("Brand settings saved. Public pages update on the next request.")
    },
    onError: (err) => {
      console.error("[useUpdateBrandSettings] failed:", err)
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null
      toast.error(typeof message === "string" ? message : "Could not save brand settings")
    },
  })
}
