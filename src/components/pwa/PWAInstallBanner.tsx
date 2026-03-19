"use client"

import { useEffect, useState } from "react"
import { DownloadIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PWAInstallBannerProps {
  visible: boolean
  forceDesktop?: boolean
  onInstall: () => void
  onDismiss: () => void
}

export function PWAInstallBanner({ visible, forceDesktop, onInstall, onDismiss }: PWAInstallBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true))
      })
    } else if (mounted) {
      setAnimateIn(false)
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, mounted])

  if (!mounted) return null

  return (
    <div
      role="dialog"
      aria-label="Install Price Lens app"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        !forceDesktop && "md:hidden",
        "transition-all duration-300 ease-out",
        animateIn ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="border-border bg-background/95 mx-3 mb-3 rounded-xl border shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* icon */}
          <div className="bg-primary/10 dark:bg-primary/15 flex size-9 shrink-0 items-center justify-center rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/price-lens.svg" alt="" width={20} height={20} className="size-5" />
          </div>

          {/* copy */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-tight font-semibold">Get the app</p>
            <p className="text-muted-foreground text-[11px] leading-tight">Faster, offline, full-screen</p>
          </div>

          {/* install cta */}
          <button
            onClick={onInstall}
            className="bg-primary text-primary-foreground flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity active:opacity-80"
          >
            <DownloadIcon className="size-3.5" />
            Install
          </button>

          {/* dismiss */}
          <button
            onClick={onDismiss}
            className="text-muted-foreground/60 hover:text-muted-foreground -mr-1 shrink-0 rounded-full p-1 transition-colors"
            aria-label="Dismiss"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
