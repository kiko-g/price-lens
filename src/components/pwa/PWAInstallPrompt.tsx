"use client"

import { useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { DownloadIcon, ShareIcon } from "lucide-react"

const DISMISSED_KEY = "pwa-install-dismissed"
const SHOW_DELAY_MS = 5_000

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /iP(hone|od|ad)/.test(ua) && /WebKit/.test(ua) && !/(CriOS|FxiOS|OPiOS|EdgiOS)/.test(ua)
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true"
  } catch {
    return false
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "true")
  } catch {}
}

export function PWAInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  const handleAndroidInstall = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    const { outcome } = await prompt.prompt()
    if (outcome === "accepted") setDismissed()
    deferredPrompt.current = null
  }, [])

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return

    // Android/Chrome: capture the native install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setTimeout(() => {
        toast("Install Price Lens", {
          description: "Add to your home screen for a full-screen app experience — no app store needed.",
          icon: <DownloadIcon className="h-5 w-5" />,
          duration: 15_000,
          action: { label: "Install", onClick: handleAndroidInstall },
          onDismiss: setDismissed,
        })
      }, SHOW_DELAY_MS)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // iOS Safari: no native prompt, show instructions instead
    if (isIOSSafari()) {
      const timer = setTimeout(() => {
        toast("Add Price Lens to Home Screen", {
          description: (
            <span>
              Tap the <ShareIcon className="mb-0.5 inline h-4 w-4" /> Share button, then{" "}
              <strong>&quot;Add to Home Screen&quot;</strong>. Make sure <strong>&quot;Open as Web App&quot;</strong> is
              enabled for the best experience.
            </span>
          ),
          duration: 20_000,
          onDismiss: setDismissed,
        })
      }, SHOW_DELAY_MS)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
  }, [handleAndroidInstall])

  return null
}
