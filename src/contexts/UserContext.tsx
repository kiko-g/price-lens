"use client"

import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Profile } from "@/types"

interface UserState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

type UserAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_PROFILE"; payload: Profile | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }

const initialState: UserState = {
  user: null,
  profile: null,
  isLoading: true,
  error: null,
}

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_USER":
      return { ...state, user: action.payload }
    case "SET_PROFILE":
      return { ...state, profile: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "RESET":
      return { ...initialState, isLoading: false }
    default:
      return state
  }
}

const UserContext = createContext<UserState | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState)
  const supabase = createClient()
  const profileFetchingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced logging for debugging
  console.info("[UserProvider] Current state:", {
    isLoading: state.isLoading,
    hasUser: !!state.user,
    hasProfile: !!state.profile,
    error: state.error,
    profileFetching: profileFetchingRef.current,
    timestamp: new Date().toISOString(),
  })

  useEffect(() => {
    let mounted = true

    const fetchProfile = async (userId: string) => {
      console.info("[UserProvider] fetchProfile called:", { userId, isFetching: profileFetchingRef.current })

      if (profileFetchingRef.current) {
        console.warn("[UserProvider] Profile already being fetched, skipping")
        return
      }

      profileFetchingRef.current = true
      console.info("[UserProvider] Starting profile fetch for user:", userId)

      // Add timeout for profile fetching
      const profileTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000),
      )

      try {
        const profilePromise = supabase.from("profiles").select("*").eq("id", userId).single()

        const { data: profileData, error: profileError } = (await Promise.race([profilePromise, profileTimeout])) as any

        console.info("[UserProvider] Profile fetch result:", {
          hasData: !!profileData,
          error: profileError?.message,
          mounted,
        })

        if (!mounted) {
          console.warn("[UserProvider] Component unmounted during profile fetch")
          return
        }

        if (profileError) {
          console.error("[UserProvider] Profile fetch error:", profileError.message)

          // If profile doesn't exist (user was deleted), this is not really an error
          if (profileError.code === "PGRST116") {
            console.info("[UserProvider] Profile not found (user may have been deleted), treating as normal")
            dispatch({ type: "SET_PROFILE", payload: null })
            dispatch({ type: "SET_ERROR", payload: null })
          } else {
            dispatch({ type: "SET_ERROR", payload: profileError.message })
            dispatch({ type: "SET_PROFILE", payload: null })
          }
        } else {
          console.info("[UserProvider] Profile fetch successful")
          dispatch({ type: "SET_PROFILE", payload: profileData })
          dispatch({ type: "SET_ERROR", payload: null })
        }
      } catch (error) {
        console.error("[UserProvider] Profile fetch exception:", error)
        if (!mounted) return
        if (error instanceof Error && error.message === "Profile fetch timeout") {
          dispatch({ type: "SET_ERROR", payload: "Profile fetch timed out" })
        } else {
          dispatch({ type: "SET_ERROR", payload: "Failed to fetch profile" })
        }
      } finally {
        console.info("[UserProvider] Profile fetch completed, resetting flag")
        profileFetchingRef.current = false
      }
    }

    // Set up a timeout to ensure loading state doesn't get stuck
    const setLoadingTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        console.warn("[UserProvider] Loading timeout reached, forcing loading to false")
        dispatch({ type: "SET_LOADING", payload: false })
      }, 10000) // 10 second timeout
    }

    setLoadingTimeout()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info("[UserProvider] Auth state change:", { event, hasSession: !!session, mounted })

      if (!mounted) {
        console.warn("[UserProvider] Auth state change ignored - component unmounted")
        return
      }

      // Clear timeout since we're processing auth change
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const user = session?.user || null
      console.info("[UserProvider] Setting user:", { hasUser: !!user, userId: user?.id })
      dispatch({ type: "SET_USER", payload: user })

      if (user) {
        console.info("[UserProvider] User found, fetching profile")
        try {
          await fetchProfile(user.id)
        } catch (error) {
          console.error("[UserProvider] Profile fetch failed in auth handler:", error)
          // Ensure we still set loading to false even if profile fetch fails
        }
      } else {
        console.info("[UserProvider] No user, resetting state")
        dispatch({ type: "RESET" })
        profileFetchingRef.current = false
      }

      console.info("[UserProvider] Setting loading to false")
      dispatch({ type: "SET_LOADING", payload: false })
    })

    return () => {
      console.info("[UserProvider] Cleaning up auth subscription")
      mounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      subscription.unsubscribe()
    }
  }, [])

  // Separate effect for initial session (runs only once)
  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      console.info("[UserProvider] Getting initial session")
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.info("[UserProvider] Initial session result:", { hasSession: !!session, mounted })

        if (!mounted) {
          console.warn("[UserProvider] Component unmounted during initial session fetch")
          return
        }

        // The onAuthStateChange will handle the session, we just trigger it
        // by calling getSession() to ensure we get the current state
      } catch (error) {
        console.error("[UserProvider] Error getting initial session:", error)
        if (!mounted) return
        dispatch({ type: "SET_ERROR", payload: "Failed to initialize session" })
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    getInitialSession()

    return () => {
      console.info("[UserProvider] Cleaning up initial session effect")
      mounted = false
    }
  }, [])

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}
