import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import {
  GlyphAbout,
  GlyphAdmin,
  GlyphApp,
  GlyphDeals,
  GlyphExplore,
  GlyphFavorites,
  GlyphHome,
} from "@/components/icons/lince-glyphs"

/**
 * Infrastructure config (URLs, author, social links). Brand strings (name, tagline, description)
 * intentionally do NOT live here — read them from `getBrand()` / `useBrand()` (Brand Control Center).
 * Hostnames stay on the current Vercel project until the domain/repo rename ships.
 */
export const siteConfig = {
  author: "Francisco Goncalves",
  url: "https://price-lens.vercel.app",
  ogImage: "https://price-lens.vercel.app/og?stats=true",
  links: {
    linkedin: "https://www.linkedin.com/in/kikogoncalves/",
    instagram: "https://www.instagram.com/kikogoncalves_",
    twitter: "https://twitter.com/kikogoncalves_",
    github: "https://github.com/kiko-g",
    repo: "https://github.com/kiko-g/price-lens",
    website: "https://kikogoncalves.com",
  },
  socialhandle: "@kikogoncalves_",
}

export function pageMetadata(title: string, description: string): Metadata {
  const ogUrl = `${siteConfig.url}/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 628, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogUrl }],
    },
  }
}

/**
 * Builds `Metadata` from translation keys under `metadata.pages.<page>.{title,description}`.
 * Used by pages with `export async function generateMetadata` so each route's SEO
 * respects the active locale.
 */
export async function pageMetadataFromKey(
  key: string,
  options?: { titleOverride?: string; descriptionOverride?: string },
): Promise<Metadata> {
  const t = await getTranslations("metadata.pages")
  const title = options?.titleOverride ?? t(`${key}.title` as never)
  const description = options?.descriptionOverride ?? t(`${key}.description` as never)
  return pageMetadata(title, description)
}

import type { ComponentType, SVGProps } from "react"

export type NavigationKey = "home" | "browse" | "deals" | "favorites" | "getTheApp" | "about" | "admin"

export type NavigationItem = {
  key: NavigationKey
  icon: ComponentType<SVGProps<SVGSVGElement>>
  href: string
  shownOnDesktop: boolean
  shownOnMobile: boolean
}

export const navigation: NavigationItem[] = [
  { key: "home", icon: GlyphHome, href: "/", shownOnDesktop: true, shownOnMobile: true },
  { key: "browse", icon: GlyphExplore, href: "/products", shownOnDesktop: true, shownOnMobile: true },
  { key: "deals", icon: GlyphDeals, href: "/deals", shownOnDesktop: true, shownOnMobile: true },
  { key: "favorites", icon: GlyphFavorites, href: "/favorites", shownOnDesktop: true, shownOnMobile: true },
  { key: "getTheApp", icon: GlyphApp, href: "/app", shownOnDesktop: false, shownOnMobile: true },
  { key: "about", icon: GlyphAbout, href: "/about", shownOnDesktop: true, shownOnMobile: true },
  // Staff-only: reachable by URL (and via the sidebar for admins), never in consumer navigation.
  { key: "admin", icon: GlyphAdmin, href: "/admin", shownOnDesktop: false, shownOnMobile: false },
]
