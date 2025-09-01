"use client"

import { useUserContext } from "@/contexts/UserContext"
import { createClient } from "@/lib/supabase/client"
import { useCallback } from "react"

export function useUser() {
  const context = useUserContext()
  const supabase = createClient()

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Manual session refresh failed:", error.message)
        return { success: false, error: error.message }
      }
      return { success: true, session }
    } catch (error) {
      console.error("Unexpected error during manual session refresh:", error)
      return { success: false, error: "Unexpected error" }
    }
  }, [supabase])

  const getSessionInfo = useCallback(() => {
    if (!context.session) return null

    const expiresAt = context.session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt ? expiresAt - now : null

    return {
      expiresAt,
      timeUntilExpiry,
      isExpired: timeUntilExpiry ? timeUntilExpiry <= 0 : true,
      refreshToken: context.session.refresh_token ? "Present" : "Missing",
      accessToken: context.session.access_token ? "Present" : "Missing",
    }
  }, [context.session])

  return {
    ...context,
    refreshSession,
    getSessionInfo,
  }
}
