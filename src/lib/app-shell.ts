/**
 * Detect when the app runs inside a store shell (PWA standalone, TWA, or Capacitor),
 * not a regular mobile browser tab.
 */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return cap?.isNativePlatform?.() === true
}

/** True when install prompts and "add to home screen" CTAs should be hidden. */
export function isEmbeddedAppShell(): boolean {
  return isStandaloneDisplayMode() || isCapacitorNative()
}
