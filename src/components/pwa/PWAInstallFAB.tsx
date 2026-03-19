"use client"

import { useEffect, useState } from "react"
import { DownloadIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PWAInstallFABProps {
  visible: boolean
  forceDesktop?: boolean
  onClick: () => void
}

export function PWAInstallFAB({ visible, forceDesktop, onClick }: PWAInstallFABProps) {
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true))
      })
      const pulseTimer = setTimeout(() => setPulse(false), 6_000)
      return () => clearTimeout(pulseTimer)
    } else if (mounted) {
      setAnimateIn(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, mounted])

  if (!mounted) return null

  return (
    <button
      onClick={onClick}
      aria-label="Install Price Lens app"
      className={cn(
        "fixed bottom-4 left-4 z-40",
        !forceDesktop && "md:hidden",
        "bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full shadow-lg",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-75 opacity-0",
        pulse && "animate-[pwa-fab-pulse_2s_ease-in-out_infinite]",
      )}
    >
      <DownloadIcon className="size-5" />
    </button>
  )
}
