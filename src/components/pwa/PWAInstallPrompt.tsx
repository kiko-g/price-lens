"use client"

import { usePWAInstall } from "@/hooks/usePWAInstall"
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner"
import { PWAInstallFAB } from "@/components/pwa/PWAInstallFAB"

export function PWAInstallPrompt() {
  const {
    installed,
    showBanner,
    showFAB,
    hasNativePrompt,
    debugMode,
    triggerInstall,
    dismiss,
    dismissFAB,
    openBannerFromFAB,
  } = usePWAInstall()

  if (installed) return null

  return (
    <>
      <PWAInstallBanner
        visible={showBanner}
        forceDesktop={debugMode}
        onInstall={triggerInstall}
        onDismiss={dismiss}
        hasNativePrompt={hasNativePrompt}
      />
      <PWAInstallFAB
        visible={showFAB && !showBanner}
        forceDesktop={debugMode}
        onClick={openBannerFromFAB}
        onDismiss={dismissFAB}
      />
    </>
  )
}
