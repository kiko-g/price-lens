"use client"

import { useUserContext } from "@/contexts/UserContext"

export function useUser() {
  return useUserContext()
}
