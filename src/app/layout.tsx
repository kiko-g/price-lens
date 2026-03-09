import { Monitoring } from "react-scan/monitoring/next"
import Script from "next/script"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import React from "react"
import { GeistSans } from "geist/font/sans"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

import { Providers } from "./providers"
import { Analytics } from "@/components/layout/Analytics"
import { Toaster } from "@/components/ui/sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt"

/**
 * Inline splash screen CSS — rendered with the HTML before any external CSS/JS loads.
 * Bridges the gap between the native PWA splash and React hydration.
 * Uses prefers-color-scheme (not .dark class) because next-themes script may not have run yet.
 */
const SPLASH_STYLES = `
#__splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;transition:opacity .5s ease-out}
#__splash .sc{display:flex;flex-direction:column;align-items:center;gap:1.25rem;animation:__sf .6s ease-out both}
#__splash .si{width:64px;height:64px;filter:drop-shadow(0 0 24px rgba(99,106,215,.4))}
#__splash .st{font-size:1.125rem;font-weight:700;letter-spacing:-.025em;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
#__splash .sb{position:absolute;bottom:5rem;width:40px;height:3px;border-radius:9999px;overflow:hidden;background:rgba(28,25,23,.1)}
#__splash .sb::after{content:'';position:absolute;inset:0;border-radius:9999px;background:rgba(99,106,215,.6);animation:__sl 1.2s ease-in-out infinite}
@media(prefers-color-scheme:dark){#__splash{background:#09090b}#__splash .st{color:#fafafa}#__splash .sb{background:rgba(250,250,249,.1)}#__splash .sb::after{background:rgba(99,106,215,.8)}}
@keyframes __sf{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
@keyframes __sl{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
#__splash[data-hidden]{opacity:0;pointer-events:none}
`

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  keywords: [
    "Price Tracking",
    "Supermarket Prices",
    "Portugal",
    "Continente",
    "Pingo Doce",
    "Auchan",
    "Price Comparison",
    "Grocery",
    "Inflation",
  ],
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.links.website,
    },
  ],
  creator: siteConfig.author,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
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
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.socialhandle,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
        <style dangerouslySetInnerHTML={{ __html: SPLASH_STYLES }} />
        <link rel="preload" href="/price-lens.svg" as="image" type="image/svg+xml" />
        <link rel="preconnect" href="https://www.continente.pt" />
        <link rel="preconnect" href="https://www.auchan.pt" />
        <link rel="preconnect" href="https://www.pingodoce.pt" />
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
      <body className={cn(GeistSans.className, "bg-background text-foreground")}>
        {/* Inline splash — visible immediately, before CSS/JS loads. Dismissed by React on hydration. */}
        <div id="__splash" aria-hidden="true">
          <div className="sc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/price-lens.svg" alt="" width={64} height={64} className="si" fetchPriority="high" />
            <span className="st">Price Lens</span>
          </div>
          <div className="sb" />
        </div>
        {/* Failsafe: hide splash after 8s even if React never hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){var s=document.getElementById('__splash');if(s)s.setAttribute('data-hidden','')},8000)`,
          }}
        />
        <Providers>
          <Analytics />
          <ServiceWorkerRegistration />
          <PWAInstallPrompt />
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
