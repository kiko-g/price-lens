import { Metadata } from "next"
import { HomeIcon, WorkflowIcon, HeartIcon, ShoppingBasketIcon } from "lucide-react"

/**
 * Cache configuration for API routes.
 * Toggle and TTL can be controlled via environment variables.
 */
export const cacheConfig = {
  storeProducts: {
    enabled: process.env.ENABLE_STORE_PRODUCTS_CACHE !== "false",
    ttlSeconds: parseInt(process.env.STORE_PRODUCTS_CACHE_TTL_SECONDS || "120", 10),
  },
}

export const siteConfig = {
  name: "Price Lens",
  title: "Price Lens",
  author: "Francisco Goncalves",
  url: "https://price-lens.vercel.app",
  ogImage: "https://price-lens.vercel.app/og.jpg",
  description:
    "Monitor daily price changes on essential consumer goods that impact inflation metrics. See beyond the headlines and tags.",
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
        height: 680,
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

export const navigation = [
  {
    icon: HomeIcon,
    label: "Home",
    href: "/",
    shown: true,
  },
  {
    icon: ShoppingBasketIcon,
    label: "Products",
    href: "/products?priority_order=true",
    shown: true,
  },
  {
    icon: HeartIcon,
    label: "Favorites",
    href: "/favorites",
    shown: true,
  },
  {
    icon: WorkflowIcon,
    label: "Admin",
    href: "/admin",
    shown: true,
  },
]
