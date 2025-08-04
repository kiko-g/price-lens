"use client"

import { createContext, useContext, useReducer, useEffect, useRef, useMemo, ReactNode } from "react"
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
  const supabase = useMemo(() => createClient(), [])
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const fetchUserAndProfile = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true })
        dispatch({ type: "SET_ERROR", payload: null })

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          dispatch({ type: "SET_ERROR", payload: userError.message })
          dispatch({ type: "RESET" })
          return
        }

        dispatch({ type: "SET_USER", payload: user })

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError) {
            dispatch({ type: "SET_ERROR", payload: profileError.message })
          } else {
            dispatch({ type: "SET_PROFILE", payload: profileData })
          }
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Unknown error" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        dispatch({ type: "SET_USER", payload: session.user })

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (!profileError) {
          dispatch({ type: "SET_PROFILE", payload: profileData })
        }
        dispatch({ type: "SET_LOADING", payload: false })
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: "RESET" })
      }
    })

    fetchUserAndProfile()

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
