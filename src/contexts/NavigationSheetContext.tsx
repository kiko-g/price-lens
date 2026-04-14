"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type NavigationSheetContextType = {
  isOpen: boolean
  setOpen: (open: boolean) => void
  openSheet: () => void
}

const NavigationSheetContext = createContext<NavigationSheetContextType | undefined>(undefined)

export function NavigationSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const openSheet = useCallback(() => setOpen(true), [])

  const value = useMemo(
    () => ({
      isOpen,
      setOpen,
      openSheet,
    }),
    [isOpen, openSheet],
  )

  return <NavigationSheetContext.Provider value={value}>{children}</NavigationSheetContext.Provider>
}

export function useNavigationSheet() {
  const ctx = useContext(NavigationSheetContext)
  if (ctx === undefined) {
    throw new Error("useNavigationSheet must be used within a NavigationSheetProvider")
  }
  return ctx
}
