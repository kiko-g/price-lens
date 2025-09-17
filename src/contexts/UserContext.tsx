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
  console.debug(state)

  useEffect(() => {
    let mounted = true

    const fetchProfile = async (userId: string) => {
      if (profileFetchingRef.current) return

      profileFetchingRef.current = true

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (!mounted) return

        if (profileError) {
          dispatch({ type: "SET_ERROR", payload: profileError.message })
          dispatch({ type: "SET_PROFILE", payload: null })
        } else {
          dispatch({ type: "SET_PROFILE", payload: profileData })
          dispatch({ type: "SET_ERROR", payload: null })
        }
      } catch (error) {
        if (!mounted) return
        dispatch({ type: "SET_ERROR", payload: "Failed to fetch profile" })
      } finally {
        profileFetchingRef.current = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const user = session?.user || null
      dispatch({ type: "SET_USER", payload: user })

      if (user) {
        await fetchProfile(user.id)
      } else {
        dispatch({ type: "RESET" })
        profileFetchingRef.current = false
      }

      dispatch({ type: "SET_LOADING", payload: false })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Separate effect for initial session (runs only once)
  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        // The onAuthStateChange will handle the session, we just trigger it
        // by calling getSession() to ensure we get the current state
      } catch (error) {
        if (!mounted) return
        console.error("Error getting initial session:", error)
        dispatch({ type: "SET_ERROR", payload: "Failed to initialize session" })
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    getInitialSession()

    return () => {
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
