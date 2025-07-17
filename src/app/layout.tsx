import { Monitoring } from "react-scan/monitoring/next"
import Script from "next/script"
import type { Metadata } from "next"

import "./globals.css"
import React from "react"
import { GeistSans } from "geist/font/sans"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

import { Providers } from "./providers"
import { Analytics } from "@/components/Analytics"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `${siteConfig.name} - %s`,
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
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
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
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.socialhandle,
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    other: [
      { url: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const useReactScan = false

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {useReactScan && (
          <>
            <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
            <Script src="https://unpkg.com/react-scan/dist/install-hook.global.js" strategy="beforeInteractive" />
            <Monitoring
              apiKey="6Hm7zTRByXQvcIe273l-uPC2VeXLbMV7"
              url="https://monitoring.react-scan.com/api/v1/ingest"
            />
          </>
        )}
      </head>
      <body className={cn(GeistSans.className)}>
        <Providers>
          <Analytics />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
