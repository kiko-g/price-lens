"use client"

import { usePWAInstall } from "@/hooks/usePWAInstall"
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner"
import { PWAInstallFAB } from "@/components/pwa/PWAInstallFAB"
import { PWAIOSGuide } from "@/components/pwa/PWAIOSGuide"

export function PWAInstallPrompt() {
  const {
    installed,
    showBanner,
    showFAB,
    showIOSGuide,
    debugMode,
    triggerInstall,
    dismiss,
    openBannerFromFAB,
    closeIOSGuide,
  } = usePWAInstall()

  if (installed) return null

  return (
    <>
      <PWAInstallBanner visible={showBanner} forceDesktop={debugMode} onInstall={triggerInstall} onDismiss={dismiss} />
      <PWAInstallFAB
        visible={showFAB && !showBanner && !showIOSGuide}
        forceDesktop={debugMode}
        onClick={openBannerFromFAB}
      />
      <PWAIOSGuide visible={showIOSGuide} forceDesktop={debugMode} onClose={closeIOSGuide} />
    </>
  )
}
