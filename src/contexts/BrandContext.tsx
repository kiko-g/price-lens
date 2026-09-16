"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useLocale } from "next-intl"

import { BRAND_DEFAULTS, getBrandMarkUrl, getBrandText, type BrandSettings } from "@/lib/brand/brand"

const BrandContext = createContext<BrandSettings>(BRAND_DEFAULTS)

/** Seeded on the server in the root layout so client reads are hydration-safe (no client fetch). */
export function BrandProvider({ brand, children }: { brand: BrandSettings; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export type BrandView = BrandSettings & {
  /** Eyebrow / tagline / meta description resolved for the active locale. */
  eyebrowText: string
  taglineText: string
  metaDescriptionText: string
  markSrc: string
}

export function useBrand(): BrandView {
  const brand = useContext(BrandContext)
  const locale = useLocale()
  return {
    ...brand,
    eyebrowText: getBrandText(brand.eyebrow, locale),
    taglineText: getBrandText(brand.tagline, locale),
    metaDescriptionText: getBrandText(brand.metaDescription, locale),
    markSrc: getBrandMarkUrl(brand, { format: "png", size: 192, tile: true }),
  }
}
