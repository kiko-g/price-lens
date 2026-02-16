import { useEffect, useRef, useState } from "react"

/**
 * Tracks touch/mouse activity on a chart container so the tooltip
 * can be suppressed while the user is scrolling on mobile.
 */
export function useChartTouch() {
  const [isActive, setIsActive] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = chartRef.current
    if (!element) return

    const handleTouchStart = () => setIsActive(true)
    const handleTouchEnd = () => setTimeout(() => setIsActive(false), 50)
    const handleMouseLeave = () => setIsActive(false)

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true })
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
      element.removeEventListener("touchcancel", handleTouchEnd)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return { chartRef, isActive }
}
