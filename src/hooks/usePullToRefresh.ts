"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  /** Minimum pull distance (px) before refresh triggers (default: 80) */
  threshold?: number
  /** Maximum visual pull distance (px) after damping (default: 120) */
  maxPull?: number
  enabled?: boolean
}

/**
 * Pull-to-refresh gesture for mobile. Only activates when the page
 * is scrolled to the very top (scrollY === 0) to coexist with iOS
 * Safari's native elastic scrolling.
 *
 * Uses refs for all gesture tracking to avoid stale-closure bugs
 * in touch event handlers. React state is only used for rendering.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const currentPull = useRef(0)
  const refreshing = useRef(false)

  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || refreshing.current) return
      if (window.scrollY > 0) return
      touchStartY.current = e.touches[0].clientY
      pulling.current = true
      currentPull.current = 0
    },
    [enabled],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing.current) return
      const diff = e.touches[0].clientY - touchStartY.current

      if (diff <= 0) {
        pulling.current = false
        currentPull.current = 0
        setPullDistance(0)
        return
      }

      const dampened = Math.min(diff * 0.35, maxPull)
      currentPull.current = dampened
      setPullDistance(dampened)
    },
    [maxPull],
  )

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false
    const dist = currentPull.current

    if (dist >= threshold && !refreshing.current) {
      refreshing.current = true
      setIsRefreshing(true)
      setPullDistance(36)

      onRefreshRef.current().finally(() => {
        refreshing.current = false
        setIsRefreshing(false)
        setPullDistance(0)
      })
    } else {
      currentPull.current = 0
      setPullDistance(0)
    }
  }, [threshold])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled])

  return {
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1),
  }
}
