import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
      try {
        const { data } = await axios.get<BrandSettingsResponse>("/api/admin/brand")
        return data
      } catch (error) {
        const message = axios.isAxiosError(error) ? error.response?.data?.error : null
        throw new Error(typeof message === "string" ? message : "Could not connect to brand storage")
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateBrandSettings() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BrandSettingsInput) => {
      const { data } = await axios.put<BrandSettingsResponse>("/api/admin/brand", input)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(BRAND_SETTINGS_QUERY_KEY, data)
      router.refresh()
      toast.success("Brand settings saved and applied.")
    },
    onError: (err) => {
      console.error("[useUpdateBrandSettings] failed:", err)
      const message = axios.isAxiosError(err) ? err.response?.data?.error : null
      toast.error(typeof message === "string" ? message : "Could not save brand settings")
    },
  })
}
