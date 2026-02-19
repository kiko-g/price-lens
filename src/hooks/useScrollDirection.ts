"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type ScrollDirection = "up" | "down" | null

interface UseScrollDirectionOptions {
  /** Minimum scroll delta before registering a direction change (default: 30) */
  threshold?: number
  /** Don't report "down" until scrolled past this Y position (default: 150) */
  minScrollY?: number
}

/**
 * Tracks window scroll direction with iOS-friendly debouncing.
 * Returns "down" when scrolling down, "up" when scrolling up, null initially.
 * Designed to avoid jitter from iOS momentum/elastic scrolling.
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirection {
  const { threshold = 30, minScrollY = 150 } = options
  const [direction, setDirection] = useState<ScrollDirection>(null)
  const lastScrollY = useRef(0)
  const lastDirection = useRef<ScrollDirection>(null)
  const ticking = useRef(false)

  const handleScroll = useCallback(() => {
    if (ticking.current) return
    ticking.current = true

    requestAnimationFrame(() => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current

      // Near the top of the page: always show (never hide nav at top)
      if (currentY < minScrollY) {
        if (lastDirection.current !== "up") {
          lastDirection.current = "up"
          setDirection("up")
        }
        lastScrollY.current = currentY
        ticking.current = false
        return
      }

      if (Math.abs(diff) >= threshold) {
        const newDirection = diff > 0 ? "down" : "up"
        if (lastDirection.current !== newDirection) {
          lastDirection.current = newDirection
          setDirection(newDirection)
        }
        lastScrollY.current = currentY
      }

      ticking.current = false
    })
  }, [threshold, minScrollY])

  useEffect(() => {
    lastScrollY.current = window.scrollY
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return direction
}
