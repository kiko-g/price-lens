"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { DownloadIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const PULSE_SESSION_KEY = "pwa-fab-pulsed"

interface PWAInstallFABProps {
  visible: boolean
  forceDesktop?: boolean
  onClick: () => void
  onDismiss: () => void
}

export function PWAInstallFAB({ visible, forceDesktop, onClick, onDismiss }: PWAInstallFABProps) {
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [pulse, setPulse] = useState(false)
  const t = useTranslations("pwa.fab")

  useEffect(() => {
    if (visible) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true))
      })

      const alreadyPulsed = sessionStorage.getItem(PULSE_SESSION_KEY) === "1"
      if (!alreadyPulsed) {
        setPulse(true)
        const pulseTimer = setTimeout(() => {
          setPulse(false)
          try {
            sessionStorage.setItem(PULSE_SESSION_KEY, "1")
          } catch {
            // sessionStorage unavailable (private browsing or storage quota)
          }
        }, 6_000)
        return () => clearTimeout(pulseTimer)
      }
    } else if (mounted) {
      setAnimateIn(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, mounted])

  if (!mounted) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-40 flex items-center gap-1.5",
        !forceDesktop && "md:hidden",
        "transition-all duration-300 ease-out",
        animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-75 opacity-0",
      )}
    >
      <button
        onClick={onClick}
        aria-label={t("install")}
        className={cn(
          "bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full shadow-lg",
          "transition-transform hover:scale-105 active:scale-95",
          pulse && "animate-[pwa-fab-pulse_2s_ease-in-out_infinite]",
        )}
      >
        <DownloadIcon className="size-5" />
      </button>
      <button
        onClick={onDismiss}
        aria-label={t("dismiss")}
        className="bg-muted/80 text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  )
}
