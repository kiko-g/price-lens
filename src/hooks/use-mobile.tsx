import * as React from "react"

const MOBILE_BREAKPOINT = 768
/** Viewport width strictly below this uses compact home entry layout (2×2 grid). */
export const COMPACT_MOBILE_BREAKPOINT_PX = 500

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsCompactMobile() {
  const [isCompact, setIsCompact] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_MOBILE_BREAKPOINT_PX - 1}px)`)
    const onChange = () => setIsCompact(mql.matches)
    mql.addEventListener("change", onChange)
    setIsCompact(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isCompact
}
