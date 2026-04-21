"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { Profile } from "@/types"

// Query keys for react-query
const PROFILE_QUERY_KEY = ["profile"] as const

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

interface UserContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isProfileLoading: boolean
  error: string | null
  refetchProfile: () => void
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    // PGRST116 = no rows found, not really an error
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }

  return data
}

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  })

  // Single auth subscription - onAuthStateChange fires immediately with current session.
  // Do not invalidate profile on TOKEN_REFRESHED (fires often when returning to the tab); that caused
  // the whole app to treat profile as "loading" again and remount home/dashboard unnecessarily.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session: session ?? null,
        isLoading: false,
      })

      if (session?.user) {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
        }
      } else {
        queryClient.setQueryData(PROFILE_QUERY_KEY, null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, queryClient])

  // Profile fetching with react-query
  const profileQueryEnabled = !!authState.user && !authState.isLoading
  const {
    data: profile,
    isPending: isProfilePending,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => fetchProfile(authState.user!.id),
    enabled: profileQueryEnabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  })

  // Only block UI on the initial profile resolution, not background refetches (e.g. after invalidate).
  const isProfileLoading = profileQueryEnabled && isProfilePending

  const handleRefetchProfile = useCallback(() => {
    refetchProfile()
  }, [refetchProfile])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserContextValue>(
    () => ({
      user: authState.user,
      session: authState.session,
      profile: profile ?? null,
      isLoading: authState.isLoading,
      isProfileLoading,
      error: profileError?.message ?? null,
      refetchProfile: handleRefetchProfile,
    }),
    [authState, profile, isProfileLoading, profileError, handleRefetchProfile],
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}

// Granular hooks for selective subscriptions
export function useAuth() {
  const { user, session, isLoading } = useUserContext()
  return useMemo(() => ({ user, session, isLoading }), [user, session, isLoading])
}

export function useProfile() {
  const { profile, isProfileLoading, error, refetchProfile } = useUserContext()
  return useMemo(
    () => ({ profile, isLoading: isProfileLoading, error, refetchProfile }),
    [profile, isProfileLoading, error, refetchProfile],
  )
}

export function useIsAdmin() {
  const { profile } = useUserContext()
  return profile?.role === "admin"
}
