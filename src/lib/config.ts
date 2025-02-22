export const siteConfig = {
  name: "Price Lens",
  author: "Francisco Goncalves",
  url: "https://pricelens.vercel.app",
  ogImage: "https://pricelens.vercel.app/og.png",
  description: "Price Lens helps you see through prices. Get a real sense of what's going on.",
  links: {
    linkedin: "https://www.linkedin.com/in/kikogoncalves/",
    instagram: "https://www.instagram.com/kikogoncalves_",
    twitter: "https://twitter.com/kikogoncalves_",
    github: "https://github.com/kiko-g",
    repo: "https://github.com/kiko-g/price-lens",
  },
}

export const navigation = [
  {
    label: "Home",
    href: "/",
    shown: true,
  },
  {
    label: "Supermarket",
    href: "/supermarket",
    shown: true,
  },
  {
    label: "Selected",
    href: "/selected",
    shown: true,
  },
  {
    label: "Admin",
    href: "/admin",
    shown: process.env.NODE_ENV === "development",
  },
]
