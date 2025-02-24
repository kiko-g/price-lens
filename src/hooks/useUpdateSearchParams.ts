"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function useUpdateSearchParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParams(newParams: Record<string, string | number | null | undefined> | null) {
    if (newParams === null) {
      router.push(window.location.pathname)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(newParams)) {
      if (value === undefined || value === null || (key === "q" && value === "")) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }

    router.push(`?${params.toString()}`)
  }

  return updateParams
}
