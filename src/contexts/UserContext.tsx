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
  const profileFetchingRef = useRef<Set<string>>(new Set())
  const mountedRef = useRef(true)

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (profileFetchingRef.current.has(userId)) return

    profileFetchingRef.current.add(userId)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (!mountedRef.current) return

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        dispatch({ type: "SET_ERROR", payload: profileError.message })
        dispatch({ type: "SET_PROFILE", payload: null })
      } else {
        dispatch({ type: "SET_PROFILE", payload: profileData })
        dispatch({ type: "SET_ERROR", payload: null })
      }
    } catch (error) {
      if (!mountedRef.current) return
      console.error("Profile fetch exception:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch profile" })
      dispatch({ type: "SET_PROFILE", payload: null })
    } finally {
      profileFetchingRef.current.delete(userId)
      // Always set loading to false after profile fetch completes
      if (mountedRef.current) {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }
  }

  const handleAuthStateChange = async (user: User | null) => {
    if (!mountedRef.current) return

    dispatch({ type: "SET_USER", payload: user })

    if (user) {
      // Clear any previous errors when we have a user
      dispatch({ type: "SET_ERROR", payload: null })
      await fetchProfile(user.id)
    } else {
      // Clear profile fetching state when logging out
      profileFetchingRef.current.clear()
      dispatch({ type: "RESET" })
    }
  }

  useEffect(() => {
    let authSubscription: any

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (error) {
          console.error("Error getting initial session:", error)
          dispatch({ type: "SET_ERROR", payload: "Failed to initialize session" })
          dispatch({ type: "SET_LOADING", payload: false })
          return
        }

        // Handle initial session
        await handleAuthStateChange(session?.user || null)

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mountedRef.current) return

          // Only handle actual auth changes, not the initial session
          // (which we already handled above)
          if (event !== "INITIAL_SESSION") {
            await handleAuthStateChange(session?.user || null)
          }
        })

        authSubscription = subscription
      } catch (error) {
        if (!mountedRef.current) return
        console.error("Auth initialization error:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to initialize authentication" })
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initializeAuth()

    return () => {
      mountedRef.current = false
      authSubscription?.unsubscribe()
      profileFetchingRef.current.clear()
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
