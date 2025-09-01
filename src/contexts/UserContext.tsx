"use client"

import { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from "react"
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user

      if (user) {
        dispatch({ type: "SET_USER", payload: user })
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (profileError) {
          dispatch({ type: "SET_ERROR", payload: profileError.message })
          dispatch({ type: "SET_PROFILE", payload: null })
        } else {
          dispatch({ type: "SET_PROFILE", payload: profileData })
        }
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
