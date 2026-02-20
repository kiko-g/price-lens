"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  /** Minimum pull distance (px) before refresh triggers (default: 80) */
  threshold?: number
  /** Maximum visual pull distance (px) after damping (default: 128) */
  maxPull?: number
  enabled?: boolean
}

/**
 * Pull-to-refresh gesture for mobile. Only activates when the page
 * is scrolled to the very top (scrollY === 0) to coexist with iOS
 * Safari's native elastic scrolling.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 128,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const pulling = useRef(false)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return
      if (window.scrollY > 0) return
      touchStartY.current = e.touches[0].clientY
      pulling.current = true
    },
    [enabled, isRefreshing],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return
      const diff = e.touches[0].clientY - touchStartY.current
      if (diff <= 0) {
        pulling.current = false
        setPullDistance(0)
        return
      }
      const dampened = Math.min(diff * 0.4, maxPull)
      setPullDistance(dampened)
    },
    [isRefreshing, maxPull],
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    const dist = pullDistance

    if (dist >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold * 0.5)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh])

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
    /** 0–1 progress toward threshold */
    progress: Math.min(pullDistance / threshold, 1),
  }
}
