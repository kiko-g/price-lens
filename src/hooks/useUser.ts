"use client"

import { useMemo } from "react"
import { useUserContext } from "@/contexts/UserContext"

export function useUser() {
  const { user, profile, isLoading, isProfileLoading, error } = useUserContext()

  // Combine loading states for backward compatibility
  // Consider auth as "loading" until both auth AND profile are resolved
  const combinedLoading = isLoading || (!!user && isProfileLoading)

  return useMemo(
    () => ({
      user,
      profile,
      isLoading: combinedLoading,
      error,
    }),
    [user, profile, combinedLoading, error],
  )
}
