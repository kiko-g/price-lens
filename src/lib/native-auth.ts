/**
 * OAuth and auth helpers for Capacitor / native shells.
 * Google blocks OAuth inside embedded WebViews — use the system browser instead.
 */

import { isCapacitorNative } from "@/lib/app-shell"

type CapacitorBrowserPlugin = {
  open: (options: { url: string; presentationStyle?: string }) => Promise<void>
}

function getCapacitorBrowser(): CapacitorBrowserPlugin | null {
  if (typeof window === "undefined") return null
  const plugins = (window as unknown as { Capacitor?: { Plugins?: { Browser?: CapacitorBrowserPlugin } } })
    .Capacitor?.Plugins
  return plugins?.Browser ?? null
}

/** Open a URL in the system browser (required for Google OAuth on iOS). */
export async function openExternalAuthUrl(url: string): Promise<void> {
  const browser = getCapacitorBrowser()
  if (isCapacitorNative() && browser) {
    await browser.open({ url, presentationStyle: "popover" })
    return
  }
  window.location.assign(url)
}

export function requiresExternalBrowserAuth(): boolean {
  return isCapacitorNative()
}
