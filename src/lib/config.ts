import { Metadata } from "next"
import {
  HomeIcon,
  StoreIcon,
  WorkflowIcon,
  GaugeIcon,
  HeartIcon,
  MicroscopeIcon,
  ShoppingBasketIcon,
} from "lucide-react"

export const siteConfig = {
  name: "Price Lens",
  title: "PriceLens",
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
    href: "/products",
    shown: true,
  },
  {
    icon: StoreIcon,
    label: "Supermarket",
    href: "/supermarket",
    shown: true,
  },
  {
    icon: MicroscopeIcon,
    label: "Tracked",
    href: "/tracked",
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
    shown: process.env.NODE_ENV === "development",
  },
]

export const adminNavigation = [
  {
    icon: WorkflowIcon,
    label: "Actions",
    href: "/admin/actions",
  },
  {
    icon: GaugeIcon,
    label: "Dashboard",
    href: "/admin/dashboard",
  },
]
