import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { HomeIcon, WorkflowIcon, HeartIcon, ShoppingBasketIcon, InfoIcon, SmartphoneIcon, TagIcon } from "lucide-react"

export const siteConfig = {
  name: "Price Lens",
  title: "Price Lens",
  author: "Francisco Goncalves",
  url: "https://price-lens.vercel.app",
  ogImage: "https://price-lens.vercel.app/og?stats=true",
  description:
    "Daily price monitoring for Portuguese supermarkets (Continente, Auchan and Pingo Doce). Turn price swings into savings. More money in your pocket. All in Price Lens.",
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

export const defaultMetadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 628,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: siteConfig.ogImage,
      },
    ],
  },
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
  { key: "home", icon: HomeIcon, href: "/", shownOnDesktop: true, shownOnMobile: true },
  { key: "browse", icon: ShoppingBasketIcon, href: "/products", shownOnDesktop: true, shownOnMobile: true },
  { key: "deals", icon: TagIcon, href: "/deals", shownOnDesktop: true, shownOnMobile: true },
  { key: "favorites", icon: HeartIcon, href: "/favorites", shownOnDesktop: true, shownOnMobile: true },
  { key: "getTheApp", icon: SmartphoneIcon, href: "/app", shownOnDesktop: false, shownOnMobile: true },
  { key: "about", icon: InfoIcon, href: "/about", shownOnDesktop: true, shownOnMobile: true },
  { key: "admin", icon: WorkflowIcon, href: "/admin", shownOnDesktop: true, shownOnMobile: true },
]
