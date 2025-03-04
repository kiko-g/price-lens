import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

import { cn } from "@/lib/utils"
import { Providers } from "./providers"
import { Analytics } from "@/components/Analytics"
import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "Shadcn UI",
    "Price Tracking",
    "Inflation",
    "CPI",
    "Consumer Price Index",
    "Real Purchasing Power",
  ],
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.links.website,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          siteConfig.name,
        )}&description=${encodeURIComponent(siteConfig.description)}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          siteConfig.name,
        )}&description=${encodeURIComponent(siteConfig.description)}`,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.className)}>
        <Providers>
          <Analytics />
          {children}
        </Providers>
      </body>
    </html>
  )
}
