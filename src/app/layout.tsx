import { Monitoring } from "react-scan/monitoring/next"
import Script from "next/script"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import React from "react"
import { GeistSans } from "geist/font/sans"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { cookies } from "next/headers"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config"
import { isLocale, toLocaleTag, toOpenGraphLocale } from "@/i18n/config"
import { getBrand } from "@/lib/brand/server"
import { getBrandMarkUrl, getBrandText } from "@/lib/brand/brand"
import { BrandProvider } from "@/contexts/BrandContext"

import { Providers } from "./providers"
import { Analytics } from "@/components/layout/Analytics"
import { Toaster } from "@/components/ui/sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import { APP_SIDEBAR_COOKIE } from "@/lib/app-shell"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt"

/**
 * Inline splash screen CSS: rendered with the HTML before any external CSS/JS loads.
 * Bridges the gap between the native PWA splash and React hydration.
 * Uses prefers-color-scheme (not .dark class) because next-themes script may not have run yet.
 * Accent rgb(234,88,12) mirrors --primary-500 (orange→red) in globals.css.
 */
const SPLASH_STYLES = `
#__splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f6f3ee;transition:opacity .5s ease-out}
#__splash .sc{display:flex;flex-direction:column;align-items:center;gap:1.25rem;animation:__sf .6s ease-out both}
#__splash .si{width:64px;height:64px}
#__splash .st{font-size:1.125rem;font-weight:700;letter-spacing:-.025em;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
#__splash .sb{position:absolute;bottom:5rem;width:40px;height:3px;border-radius:9999px;overflow:hidden;background:rgba(28,25,23,.1)}
#__splash .sb::after{content:'';position:absolute;inset:0;border-radius:9999px;background:rgba(234,88,12,.6);animation:__sl 1.2s ease-in-out infinite}
@media(prefers-color-scheme:dark){#__splash{background:#0b0f1a}#__splash .st{color:#fafafa}#__splash .sb{background:rgba(250,250,249,.1)}#__splash .sb::after{background:rgba(234,88,12,.8)}}
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
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, brand] = await Promise.all([getLocale(), getBrand()])
  const description = getBrandText(brand.metaDescription, locale)
  const name = brand.displayName

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    metadataBase: new URL(siteConfig.url),
    description,
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
      title: name,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: toOpenGraphLocale(isLocale(locale) ? locale : "pt"),
      url: siteConfig.url,
      title: name,
      description,
      siteName: name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 628,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [siteConfig.ogImage],
      creator: siteConfig.socialhandle,
    },
    icons: {
      icon: [
        { url: getBrandMarkUrl(brand, { tile: true }), type: "image/svg+xml" },
        { url: getBrandMarkUrl(brand, { format: "png", size: 16, tile: true }), sizes: "16x16", type: "image/png" },
        { url: getBrandMarkUrl(brand, { format: "png", size: 32, tile: true }), sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: getBrandMarkUrl(brand, { format: "png", size: 180, tile: true }), sizes: "180x180", type: "image/png" },
      ],
      other: [
        { url: getBrandMarkUrl(brand, { format: "png", size: 192, tile: true }), sizes: "192x192", type: "image/png" },
        { url: getBrandMarkUrl(brand, { format: "png", size: 512, tile: true }), sizes: "512x512", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const useReactScan = false
  const [locale, messages, brand, cookieStore] = await Promise.all([getLocale(), getMessages(), getBrand(), cookies()])
  const sidebarDefaultCollapsed = cookieStore.get(APP_SIDEBAR_COOKIE)?.value === "1"
  const htmlLang = toLocaleTag(isLocale(locale) ? locale : "pt")

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: SPLASH_STYLES }} />
        <link
          rel="preload"
          href={getBrandMarkUrl(brand, { theme: "paper" })}
          as="image"
          type="image/svg+xml"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="preload"
          href={getBrandMarkUrl(brand, { theme: "navy" })}
          as="image"
          type="image/svg+xml"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="preconnect" href="https://www.continente.pt" />
        <link rel="preconnect" href="https://www.auchan.pt" />
        <link rel="preconnect" href="https://www.pingodoce.pt" />
        {useReactScan && (
          <>
            <Script
              src="https://unpkg.com/react-scan/dist/auto.global.js"
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
            <Script src="https://unpkg.com/react-scan/dist/install-hook.global.js" strategy="beforeInteractive" />
            <Monitoring
              apiKey="6Hm7zTRByXQvcIe273l-uPC2VeXLbMV7"
              url="https://monitoring.react-scan.com/api/v1/ingest"
            />
          </>
        )}
      </head>
      <body className={cn(GeistSans.className, "bg-background text-foreground")}>
        {/* Inline splash: visible immediately, before CSS/JS loads. Dismissed by React on hydration. */}
        <div id="__splash" aria-hidden="true">
          <div className="sc">
            <picture>
              <source media="(prefers-color-scheme: dark)" srcSet={getBrandMarkUrl(brand, { theme: "navy" })} />
              <img
                src={getBrandMarkUrl(brand, { theme: "paper" })}
                alt=""
                width={64}
                height={64}
                className="si"
                fetchPriority="high"
              />
            </picture>
            <span className="st">{brand.displayName}</span>
          </div>
          <div className="sb" />
        </div>
        {/* Failsafe: hide splash after 8s even if React never hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){var s=document.getElementById('__splash');if(s)s.setAttribute('data-hidden','')},8000)`,
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BrandProvider brand={brand}>
            <Providers>
              <Analytics />
              <ServiceWorkerRegistration />
              <PWAInstallPrompt />
              <MainLayout sidebarDefaultCollapsed={sidebarDefaultCollapsed}>{children}</MainLayout>
              <Toaster />
            </Providers>
          </BrandProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
