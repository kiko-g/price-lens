import "server-only"

import type { Metadata } from "next"
import { getLocale } from "next-intl/server"

import { siteConfig } from "@/lib/config"
import { getBrandText } from "./brand"
import { getBrand } from "./server"

/** Home/default metadata built from the Brand Control Center (title, description) for the active locale. */
export async function defaultMetadata(): Promise<Metadata> {
  const [brand, locale] = await Promise.all([getBrand(), getLocale()])
  return {
    title: brand.displayName,
    description: getBrandText(brand.metaDescription, locale),
    openGraph: {
      images: [{ url: siteConfig.ogImage, width: 1200, height: 628, alt: brand.displayName }],
    },
    twitter: {
      card: "summary_large_image",
      images: [{ url: siteConfig.ogImage }],
    },
  }
}
