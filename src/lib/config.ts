import { HomeIcon, ShieldIcon, ShoppingBasketIcon, StoreIcon } from "lucide-react"
import { Metadata } from "next"

const titleOrName = "Price Lens"

export const siteConfig = {
  name: titleOrName,
  title: titleOrName,
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
    icon: ShieldIcon,
    label: "Admin",
    href: "/admin",
    shown: process.env.NODE_ENV === "development",
  },
]
