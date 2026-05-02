/** Set before navigating to `/products/barcode/...` so loading UI can show the digits. */
export const LAST_BARCODE_LOOKUP_STORAGE_KEY = "priceLens:lastBarcodeLookup"

const MAX_AGE_MS = 120_000

type StoredPayload = { code: string; t: number }

function parseStored(raw: string): StoredPayload | null {
  try {
    const o = JSON.parse(raw) as unknown
    if (o && typeof o === "object" && "code" in o && "t" in o) {
      const code = (o as { code: unknown }).code
      const t = (o as { t: unknown }).t
      if (typeof code === "string" && typeof t === "number") return { code, t }
    }
  } catch {
    // legacy: plain barcode string
    if (/^\d{8,14}$/.test(raw)) return { code: raw, t: Date.now() }
  }
  return null
}

export function setLastBarcodeLookup(code: string): void {
  try {
    sessionStorage.setItem(
      LAST_BARCODE_LOOKUP_STORAGE_KEY,
      JSON.stringify({ code, t: Date.now() } satisfies StoredPayload),
    )
  } catch {
    /* ignore */
  }
}

/** Returns digits if a recent scan is pending, else null. */
export function readLastBarcodeLookup(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(LAST_BARCODE_LOOKUP_STORAGE_KEY)
    if (!raw) return null
    const parsed = parseStored(raw)
    if (!parsed) {
      sessionStorage.removeItem(LAST_BARCODE_LOOKUP_STORAGE_KEY)
      return null
    }
    if (Date.now() - parsed.t > MAX_AGE_MS) {
      sessionStorage.removeItem(LAST_BARCODE_LOOKUP_STORAGE_KEY)
      return null
    }
    return parsed.code
  } catch {
    return null
  }
}

export function clearLastBarcodeLookup(): void {
  try {
    sessionStorage.removeItem(LAST_BARCODE_LOOKUP_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
