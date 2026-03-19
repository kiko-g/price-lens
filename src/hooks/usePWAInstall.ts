"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const STORAGE_KEY = "pwa-install-state"
const SHOW_DELAY_MS = 4_000
const COOLDOWN_TIERS_DAYS = [1, 3, 7, 30]

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "android" | "ios" | "desktop"
type DismissState = { count: number; lastAt: string }

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop"
  const ua = navigator.userAgent
  if (/iP(hone|od|ad)/.test(ua) && /WebKit/.test(ua)) return "ios"
  if (/Android/.test(ua)) return "android"
  return "desktop"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function getDismissState(): DismissState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DismissState) : null
  } catch {
    return null
  }
}

function saveDismissState(state: DismissState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function isCoolingDown(): boolean {
  const state = getDismissState()
  if (!state) return false

  const tierIndex = Math.min(state.count - 1, COOLDOWN_TIERS_DAYS.length - 1)
  const cooldownMs = COOLDOWN_TIERS_DAYS[tierIndex] * 24 * 60 * 60 * 1000
  const elapsed = Date.now() - new Date(state.lastAt).getTime()
  return elapsed < cooldownMs
}

function hasBeenDismissedBefore(): boolean {
  return getDismissState() !== null
}

export function usePWAInstall() {
  const [showBanner, setShowBanner] = useState(false)
  const [showFAB, setShowFAB] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installed, setInstalled] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const platform = useRef<Platform>("desktop")
  const debugRef = useRef(false)

  useEffect(() => {
    // ?pwa-debug or ?pwa-debug=ios — force-show on any browser for testing
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get("pwa-debug")
    if (debugParam !== null) {
      localStorage.removeItem(STORAGE_KEY)
      debugRef.current = true
      platform.current = debugParam === "ios" ? "ios" : "android"
      setTimeout(() => setShowBanner(true), 500)
      return
    }

    if (isStandalone()) {
      setInstalled(true)
      return
    }

    platform.current = getPlatform()

    if (isCoolingDown()) {
      setShowFAB(true)
      return
    }

    if (hasBeenDismissedBefore() && !isCoolingDown()) {
      setShowFAB(true)
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent

      if (!isCoolingDown() && !hasBeenDismissedBefore()) {
        setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    const handleInstalled = () => {
      setInstalled(true)
      setShowBanner(false)
      setShowFAB(false)
      setShowIOSGuide(false)
      deferredPrompt.current = null
    }

    window.addEventListener("appinstalled", handleInstalled)

    if (platform.current === "ios" && !hasBeenDismissedBefore()) {
      setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    if (platform.current === "ios") {
      setShowIOSGuide(true)
      setShowBanner(false)
      return
    }

    const prompt = deferredPrompt.current
    if (!prompt) return
    const { outcome } = await prompt.prompt()
    if (outcome === "accepted") {
      setInstalled(true)
      setShowBanner(false)
      setShowFAB(false)
    }
    deferredPrompt.current = null
  }, [])

  const dismiss = useCallback(() => {
    const prev = getDismissState()
    saveDismissState({
      count: (prev?.count ?? 0) + 1,
      lastAt: new Date().toISOString(),
    })
    setShowBanner(false)
    setShowFAB(true)
  }, [])

  const openBannerFromFAB = useCallback(() => {
    if (platform.current === "ios") {
      setShowIOSGuide(true)
    } else {
      setShowBanner(true)
    }
  }, [])

  const closeIOSGuide = useCallback(() => {
    setShowIOSGuide(false)
    dismiss()
  }, [dismiss])

  return {
    platform: platform.current,
    installed,
    showBanner,
    showFAB,
    showIOSGuide,
    debugMode: debugRef.current,
    triggerInstall,
    dismiss,
    openBannerFromFAB,
    closeIOSGuide,
  }
}
