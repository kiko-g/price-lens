"use client"

import { createContext, useContext, useReducer, useEffect, useRef, useMemo, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { Profile } from "@/types"
import { AUTH_CONFIG, getAuthErrorMessage } from "@/lib/auth-config"

interface UserState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  error: string | null
  lastActivity: number | null
}

type UserAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_PROFILE"; payload: Profile | null }
  | { type: "SET_SESSION"; payload: Session | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_ACTIVITY" }
  | { type: "RESET" }

const initialState: UserState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  error: null,
  lastActivity: null,
}

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_USER":
      return { ...state, user: action.payload }
    case "SET_PROFILE":
      return { ...state, profile: action.payload }
    case "SET_SESSION":
      return { ...state, session: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "UPDATE_ACTIVITY":
      return { ...state, lastActivity: Date.now() }
    case "RESET":
      return { ...initialState, isLoading: false }
    default:
      return state
  }
}

const UserContext = createContext<UserState | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState)
  const supabase = useMemo(() => createClient(), [])
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError.message)
        dispatch({ type: "SET_ERROR", payload: getAuthErrorMessage(profileError.message) })
        dispatch({ type: "SET_PROFILE", payload: null })
      } else {
        dispatch({ type: "SET_PROFILE", payload: profileData })
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch user profile" })
    }
  }

  // Function to handle session refresh
  const handleSessionRefresh = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Session refresh error:", error.message)
        dispatch({ type: "SET_ERROR", payload: getAuthErrorMessage(error.message) })
        // Don't reset on refresh errors, let the auth state change handle it
      } else if (session) {
        dispatch({ type: "SET_SESSION", payload: session })
        dispatch({ type: "SET_USER", payload: session.user })
        await fetchUserProfile(session.user.id)
        dispatch({ type: "UPDATE_ACTIVITY" })

        // Log auth changes in development
        if (AUTH_CONFIG.development.logAuthChanges) {
          console.log("Session refreshed successfully:", { userId: session.user.id })
        }
      }
    } catch (error) {
      console.error("Unexpected error during session refresh:", error)
    }
  }

  // Set up periodic session refresh using centralized configuration
  useEffect(() => {
    if (state.session) {
      refreshTimerRef.current = setInterval(handleSessionRefresh, AUTH_CONFIG.session.refreshInterval)
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [state.session])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Initial session error:", error.message)
          dispatch({ type: "SET_ERROR", payload: getAuthErrorMessage(error.message) })
        } else if (session) {
          dispatch({ type: "SET_SESSION", payload: session })
          dispatch({ type: "SET_USER", payload: session.user })
          await fetchUserProfile(session.user.id)
          dispatch({ type: "UPDATE_ACTIVITY" })

          // Log auth changes in development
          if (AUTH_CONFIG.development.logAuthChanges) {
            console.log("Initial session loaded:", { userId: session.user.id })
          }
        }
      } catch (error) {
        console.error("Unexpected error getting initial session:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to get initial session" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Log auth changes in development
      if (AUTH_CONFIG.development.logAuthChanges) {
        console.log("Auth state change:", event, session?.user?.id)
      }

      if (session?.user) {
        dispatch({ type: "SET_SESSION", payload: session })
        dispatch({ type: "SET_USER", payload: session.user })
        await fetchUserProfile(session.user.id)
        dispatch({ type: "UPDATE_ACTIVITY" })
      } else {
        dispatch({ type: "RESET" })
      }
      dispatch({ type: "SET_LOADING", payload: false })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}
