"use client"

import { useState, useEffect, useRef } from "react"

type ScrollDirection = "up" | "down" | null

/**
 * Tracks window scroll direction. Returns "down" when scrolling down,
 * "up" when scrolling up, and null before any scroll event.
 * Uses a threshold to avoid jitter from small movements.
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const diff = currentY - lastScrollY.current

        if (Math.abs(diff) >= threshold) {
          setDirection(diff > 0 ? "down" : "up")
          lastScrollY.current = currentY
        }

        ticking.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return direction
}
