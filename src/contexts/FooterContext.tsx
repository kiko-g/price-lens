"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"

interface FooterContextType {
  isFooterHidden: boolean
  hideFooter: () => void
  showFooter: () => void
}

const FooterContext = createContext<FooterContextType | undefined>(undefined)

export function FooterProvider({ children }: { children: ReactNode }) {
  const [isFooterHidden, setIsFooterHidden] = useState(false)

  const hideFooter = useCallback(() => setIsFooterHidden(true), [])
  const showFooter = useCallback(() => setIsFooterHidden(false), [])

  return (
    <FooterContext.Provider value={{ isFooterHidden, hideFooter, showFooter }}>
      {children}
    </FooterContext.Provider>
  )
}

export function useFooter() {
  const context = useContext(FooterContext)
  if (context === undefined) {
    throw new Error("useFooter must be used within a FooterProvider")
  }
  return context
}

export function HideFooter() {
  const { hideFooter, showFooter } = useFooter()

  useEffect(() => {
    hideFooter()
    return () => showFooter()
  }, [hideFooter, showFooter])

  return null
}
