import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import type { LivePulse } from "@/app/api/stats/home/route"

/** Compact live catalog pulse for the app shell. Cheap (one snapshot row), cached 5 min. */
export function useLivePulse(enabled = true) {
  return useQuery({
    queryKey: ["stats", "live-pulse"],
    queryFn: async () => {
      const { data } = await axios.get<LivePulse>("/api/stats/home")
      return data
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}
