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
    const noQuery = newParams.q === ""

    for (const [key, value] of Object.entries(newParams)) {
      const isBlank = value === undefined || value === null
      const isQueryEmpty = key === "q" && value === ""
      const isSearchTypeName = noQuery && key === "t" && value === "name"

      if (isBlank || isQueryEmpty || isSearchTypeName) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }

    router.push(`?${params.toString()}`)
  }

  return updateParams
}
