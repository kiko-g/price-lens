"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const DISMISS_KEY = "pwa-install-state"
const INSTALLED_KEY = "pwa-installed"
const SHOW_DELAY_MS = 4_000
const COOLDOWN_TIERS_DAYS = [1, 3, 7, 30]
const MAX_DISMISSALS = 4

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

function wasInstalledBefore(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1"
  } catch {
    return false
  }
}

function markInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, "1")
  } catch {}
}

function getDismissState(): DismissState | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    return raw ? (JSON.parse(raw) as DismissState) : null
  } catch {
    return null
  }
}

function saveDismissState(state: DismissState): void {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(state))
  } catch {}
}

function isPermanentlyDismissed(): boolean {
  const state = getDismissState()
  return state !== null && state.count >= MAX_DISMISSALS
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
  const [installed, setInstalled] = useState(false)
  const [hasNativePrompt, setHasNativePrompt] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const platform = useRef<Platform>("desktop")
  const debugRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const debugParam = params.get("pwa-debug")
    if (debugParam !== null) {
      localStorage.removeItem(DISMISS_KEY)
      localStorage.removeItem(INSTALLED_KEY)
      debugRef.current = true
      platform.current = debugParam === "ios" ? "ios" : "android"
      setTimeout(() => setShowBanner(true), 500)
      return
    }

    if (isStandalone() || wasInstalledBefore()) {
      setInstalled(true)
      return
    }

    if (isPermanentlyDismissed()) return

    platform.current = getPlatform()

    if (isCoolingDown()) return

    if (hasBeenDismissedBefore()) {
      setShowFAB(true)
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setHasNativePrompt(true)

      if (!hasBeenDismissedBefore()) {
        setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    const handleInstalled = () => {
      markInstalled()
      setInstalled(true)
      setShowBanner(false)
      setShowFAB(false)
      deferredPrompt.current = null
    }

    window.addEventListener("appinstalled", handleInstalled)

    // on iOS (no beforeinstallprompt), show the banner pointing to /app
    if (platform.current === "ios" && !hasBeenDismissedBefore()) {
      setTimeout(() => setShowBanner(true), SHOW_DELAY_MS)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    const { outcome } = await prompt.prompt()
    if (outcome === "accepted") {
      markInstalled()
      setInstalled(true)
      setShowBanner(false)
      setShowFAB(false)
    }
    deferredPrompt.current = null
  }, [])

  const dismiss = useCallback(() => {
    const prev = getDismissState()
    const newCount = (prev?.count ?? 0) + 1
    saveDismissState({ count: newCount, lastAt: new Date().toISOString() })
    setShowBanner(false)
    if (newCount >= MAX_DISMISSALS) {
      setShowFAB(false)
    } else {
      setShowFAB(true)
    }
  }, [])

  const dismissFAB = useCallback(() => {
    setShowFAB(false)
  }, [])

  const openBannerFromFAB = useCallback(() => {
    setShowBanner(true)
  }, [])

  return {
    platform: platform.current,
    installed,
    showBanner,
    showFAB,
    hasNativePrompt,
    debugMode: debugRef.current,
    triggerInstall,
    dismiss,
    dismissFAB,
    openBannerFromFAB,
  }
}
