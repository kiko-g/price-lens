"use client"

import { useEffect } from "react"
import { clearLastBarcodeLookup } from "@/lib/barcode-scan-storage"

/** Clears scan handoff hint once a concrete product or barcode result route has mounted. */
export function BarcodeLookupSessionCleanup() {
  useEffect(() => {
    clearLastBarcodeLookup()
  }, [])
  return null
}
